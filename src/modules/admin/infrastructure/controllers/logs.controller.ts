import { Request, Response } from 'express';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { ApiResponse } from '../../../../shared/domain/wrappers/api-response.wrapper';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

interface LogFile {
  name: string;
  size: number;
  lastModified: string;
  type: 'combined' | 'error' | 'daily';
}

export class LogsController {
  private readonly logger = LoggerService.getInstance();
  private readonly logsPath = join(process.cwd(), 'logs');

  /**
   * Get list of available log files
   */
  public async getLogFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = await readdir(this.logsPath);
      const logFiles: LogFile[] = [];

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filePath = join(this.logsPath, file);
        const stats = await stat(filePath);

        let type: LogFile['type'] = 'combined';
        if (file.includes('error')) type = 'error';
        else if (file.match(/\d{4}-\d{2}-\d{2}/)) type = 'daily';

        logFiles.push({
          name: file,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          type,
        });
      }

      // Sort by last modified, newest first
      logFiles.sort(
        (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );

      const response = ApiResponse.success(logFiles, 'Log files retrieved successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to get log files', error);
      const response = ApiResponse.internalError('Failed to retrieve log files');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Get logs from a specific file with pagination and filtering
   */
  public async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        file = 'combined.log',
        page = '1',
        limit = '100',
        level,
        search,
        startDate,
        endDate,
      } = req.query as Record<string, string>;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      // Validate file name to prevent path traversal
      if (file.includes('..') || file.includes('/') || file.includes('\\')) {
        const response = ApiResponse.badRequest('Invalid file name');
        res.status(400).json(response.toJSON());
        return;
      }

      const filePath = join(this.logsPath, file);
      let content: string;

      try {
        content = await readFile(filePath, 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          const response = ApiResponse.notFound('Log file not found');
          res.status(404).json(response.toJSON());
          return;
        }
        throw error;
      }

      const lines = content.split('\n').filter(line => line.trim());
      const logEntries: LogEntry[] = [];

      // Parse log entries
      for (const line of lines) {
        try {
          // Try to parse as JSON (structured logs)
          const entry = JSON.parse(line) as LogEntry;
          logEntries.push(entry);
        } catch {
          // If not JSON, try to parse as plain text
          const match = line.match(
            /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(\w+):\s+(.+)/
          );
          if (match) {
            logEntries.push({
              timestamp: match[1],
              level: match[2],
              message: match[3],
            });
          } else {
            // Fallback for unstructured logs
            logEntries.push({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: line,
            });
          }
        }
      }

      // Apply filters
      let filteredEntries = logEntries;

      // Filter by log level
      if (level) {
        filteredEntries = filteredEntries.filter(
          entry => entry.level.toLowerCase() === level.toLowerCase()
        );
      }

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        filteredEntries = filteredEntries.filter(
          entry =>
            entry.message.toLowerCase().includes(searchLower) ||
            JSON.stringify(entry.context || {})
              .toLowerCase()
              .includes(searchLower)
        );
      }

      // Filter by date range
      if (startDate) {
        filteredEntries = filteredEntries.filter(
          entry => new Date(entry.timestamp) >= new Date(startDate)
        );
      }
      if (endDate) {
        filteredEntries = filteredEntries.filter(
          entry => new Date(entry.timestamp) <= new Date(endDate)
        );
      }

      // Sort by timestamp (newest first)
      filteredEntries.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply pagination
      const total = filteredEntries.length;
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

      const totalPages = Math.ceil(total / limitNum);

      const result = {
        logs: paginatedEntries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
        filters: {
          file,
          level,
          search,
          startDate,
          endDate,
        },
      };

      const response = ApiResponse.success(result, 'Logs retrieved successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to get logs', error);
      const response = ApiResponse.internalError('Failed to retrieve logs');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Get log levels and their counts for a specific file
   */
  public async getLogStats(req: Request, res: Response): Promise<void> {
    try {
      const { file = 'combined.log' } = req.query as Record<string, string>;

      // Validate file name
      if (file.includes('..') || file.includes('/') || file.includes('\\')) {
        const response = ApiResponse.badRequest('Invalid file name');
        res.status(400).json(response.toJSON());
        return;
      }

      const filePath = join(this.logsPath, file);
      let content: string;

      try {
        content = await readFile(filePath, 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          const response = ApiResponse.notFound('Log file not found');
          res.status(404).json(response.toJSON());
          return;
        }
        throw error;
      }

      const lines = content.split('\n').filter(line => line.trim());
      const levelCounts: Record<string, number> = {};
      let totalEntries = 0;

      for (const line of lines) {
        totalEntries++;
        try {
          const entry = JSON.parse(line) as LogEntry;
          const level = entry.level?.toLowerCase() || 'unknown';
          levelCounts[level] = (levelCounts[level] || 0) + 1;
        } catch {
          // For plain text logs, try to extract level
          const match = line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s+(\w+):/);
          const level = match?.[1]?.toLowerCase() || 'unknown';
          levelCounts[level] = (levelCounts[level] || 0) + 1;
        }
      }

      const stats = {
        totalEntries,
        levelCounts,
        file,
        generatedAt: new Date().toISOString(),
      };

      const response = ApiResponse.success(stats, 'Log statistics retrieved successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to get log stats', error);
      const response = ApiResponse.internalError('Failed to retrieve log statistics');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Clear logs from a specific file (admin only)
   */
  public async clearLogs(req: Request, res: Response): Promise<void> {
    try {
      const { file } = req.body;

      if (!file) {
        const response = ApiResponse.badRequest('File name is required');
        res.status(400).json(response.toJSON());
        return;
      }

      // Validate file name
      if (file.includes('..') || file.includes('/') || file.includes('\\')) {
        const response = ApiResponse.badRequest('Invalid file name');
        res.status(400).json(response.toJSON());
        return;
      }

      const filePath = join(this.logsPath, file);

      try {
        await readFile(filePath, 'utf-8'); // Check if file exists
        await import('fs/promises').then(fs => fs.writeFile(filePath, '')); // Clear the file

        this.logger.audit('Log file cleared', { file, clearedAt: new Date().toISOString() });

        const response = ApiResponse.success(null, `Log file ${file} cleared successfully`);
        res.status(200).json(response.toJSON());
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          const response = ApiResponse.notFound('Log file not found');
          res.status(404).json(response.toJSON());
          return;
        }
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to clear logs', error);
      const response = ApiResponse.internalError('Failed to clear logs');
      res.status(500).json(response.toJSON());
    }
  }
}
