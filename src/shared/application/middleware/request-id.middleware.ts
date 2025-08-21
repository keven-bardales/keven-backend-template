import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../../infrastructure/logging/logger.service';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    startTime?: number;
  }
}

export class RequestIdMiddleware {
  private static readonly REQUEST_ID_HEADER = 'X-Request-Id';
  private static readonly CORRELATION_ID_HEADER = 'X-Correlation-Id';
  private static readonly logger = LoggerService.getInstance();

  public static track() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Generate or use existing request ID
      const requestId =
        (req.headers[RequestIdMiddleware.REQUEST_ID_HEADER.toLowerCase()] as string) ||
        (req.headers[RequestIdMiddleware.CORRELATION_ID_HEADER.toLowerCase()] as string) ||
        uuidv4();

      // Attach to request object
      req.id = requestId;
      req.startTime = Date.now();

      // Set response header
      res.setHeader(RequestIdMiddleware.REQUEST_ID_HEADER, requestId);

      // Log request start
      RequestIdMiddleware.logger.info('Request started', {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
      });

      // Log response when finished
      const originalSend = res.send;
      res.send = function (data): Response {
        const duration = req.startTime ? Date.now() - req.startTime : 0;

        RequestIdMiddleware.logger.info('Request completed', {
          requestId,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          duration,
          contentLength: res.get('Content-Length'),
        });

        res.send = originalSend;
        return res.send(data);
      };

      next();
    };
  }

  public static getRequestId(req: Request): string | undefined {
    return req.id;
  }

  public static setRequestId(req: Request, id: string): void {
    req.id = id;
  }
}
