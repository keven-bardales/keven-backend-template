/**
 * @swagger
 * tags:
 *   name: Admin - Logs
 *   description: System logs management and monitoring
 */
import { Router } from 'express';
import { LogsController } from '../controllers/logs.controller';
import { ValidationMiddleware } from '../../../../shared/application/middleware/validation.middleware';
import { AuthMiddleware } from '../../../../shared/application/middleware/auth.middleware';
import { RateLimitMiddleware } from '../../../../api/middleware/rate-limit.middleware';
import { z } from 'zod';

// Validation schemas
const GetLogsQuerySchema = z.object({
  file: z.string().optional().default('combined.log'),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .refine(val => parseInt(val) <= 1000)
    .optional()
    .default('100'),
  level: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const LogStatsQuerySchema = z.object({
  file: z.string().optional().default('combined.log'),
});

const ClearLogsSchema = z.object({
  file: z.string().min(1, 'File name is required'),
});

export class LogsRoutes {
  private readonly router: Router;

  constructor(private readonly logsController: LogsController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Apply rate limiting to all log routes
    this.router.use(RateLimitMiddleware.sensitive());

    /**
     * @swagger
     * /admin/logs/files:
     *   get:
     *     summary: Get available log files
     *     description: Retrieve a list of all available log files with metadata
     *     tags: [Admin - Logs]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Log files retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Log files retrieved successfully
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       name:
     *                         type: string
     *                         example: combined.log
     *                       size:
     *                         type: number
     *                         example: 1048576
     *                       lastModified:
     *                         type: string
     *                         format: date-time
     *                       type:
     *                         type: string
     *                         enum: [combined, error, daily]
     *                         example: combined
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions (admin required)
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/files',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['admin:logs:read']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.logsController.getLogFiles.bind(this.logsController))
    );

    /**
     * @swagger
     * /admin/logs:
     *   get:
     *     summary: Get logs with filtering and pagination
     *     description: Retrieve logs from a specific file with advanced filtering options
     *     tags: [Admin - Logs]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: file
     *         schema:
     *           type: string
     *           default: combined.log
     *         description: Log file name
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 1000
     *           default: 100
     *         description: Number of log entries per page
     *       - in: query
     *         name: level
     *         schema:
     *           type: string
     *           enum: [error, warn, info, debug, verbose]
     *         description: Filter by log level
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term for log messages
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Filter logs from this date onwards
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Filter logs up to this date
     *     responses:
     *       200:
     *         description: Logs retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Logs retrieved successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     logs:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/LogEntry'
     *                     pagination:
     *                       type: object
     *                       properties:
     *                         page:
     *                           type: number
     *                         limit:
     *                           type: number
     *                         total:
     *                           type: number
     *                         totalPages:
     *                           type: number
     *                         hasNextPage:
     *                           type: boolean
     *                         hasPreviousPage:
     *                           type: boolean
     *                     filters:
     *                       type: object
     *                       properties:
     *                         file:
     *                           type: string
     *                         level:
     *                           type: string
     *                         search:
     *                           type: string
     *                         startDate:
     *                           type: string
     *                         endDate:
     *                           type: string
     *       400:
     *         description: Invalid request parameters
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Log file not found
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/',
      ValidationMiddleware.validate(GetLogsQuerySchema, 'query'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['admin:logs:read']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.logsController.getLogs.bind(this.logsController))
    );

    /**
     * @swagger
     * /admin/logs/stats:
     *   get:
     *     summary: Get log statistics
     *     description: Get statistics about log entries including level counts
     *     tags: [Admin - Logs]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: file
     *         schema:
     *           type: string
     *           default: combined.log
     *         description: Log file name
     *     responses:
     *       200:
     *         description: Log statistics retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Log statistics retrieved successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     totalEntries:
     *                       type: number
     *                       example: 15432
     *                     levelCounts:
     *                       type: object
     *                       properties:
     *                         error:
     *                           type: number
     *                           example: 45
     *                         warn:
     *                           type: number
     *                           example: 123
     *                         info:
     *                           type: number
     *                           example: 14567
     *                         debug:
     *                           type: number
     *                           example: 697
     *                     file:
     *                       type: string
     *                       example: combined.log
     *                     generatedAt:
     *                       type: string
     *                       format: date-time
     *       400:
     *         description: Invalid file name
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Log file not found
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/stats',
      ValidationMiddleware.validate(LogStatsQuerySchema, 'query'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['admin:logs:read']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.logsController.getLogStats.bind(this.logsController))
    );

    /**
     * @swagger
     * /admin/logs/clear:
     *   post:
     *     summary: Clear log file
     *     description: Clear all entries from a specific log file (admin only)
     *     tags: [Admin - Logs]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - file
     *             properties:
     *               file:
     *                 type: string
     *                 description: Name of the log file to clear
     *                 example: combined.log
     *     responses:
     *       200:
     *         description: Log file cleared successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Log file combined.log cleared successfully
     *                 data:
     *                   type: null
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions (admin required)
     *       404:
     *         description: Log file not found
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/clear',
      ValidationMiddleware.validate(ClearLogsSchema, 'body'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['admin:logs:write']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.logsController.clearLogs.bind(this.logsController))
    );
  }

  // Async error handler wrapper
  private asyncHandler(fn: any) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  public getRouter(): Router {
    return this.router;
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     LogEntry:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Log entry timestamp
 *         level:
 *           type: string
 *           enum: [error, warn, info, debug, verbose]
 *           description: Log level
 *         message:
 *           type: string
 *           description: Log message
 *         context:
 *           type: object
 *           description: Additional context data (optional)
 *         stack:
 *           type: string
 *           description: Stack trace (for errors)
 *       required:
 *         - timestamp
 *         - level
 *         - message
 */

// Factory function to create routes
export function createLogsRoutes(logsController: LogsController): Router {
  const logsRoutes = new LogsRoutes(logsController);
  return logsRoutes.getRouter();
}
