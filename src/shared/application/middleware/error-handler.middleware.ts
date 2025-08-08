import { Request, Response, NextFunction } from 'express';
import { BaseException, ValidationException } from '../../domain/exceptions/global-exceptions';
import { ApiResponse } from '../../domain/wrappers/api-response.wrapper';
import { ZodError } from 'zod';

export class ErrorHandlerMiddleware {
  public static handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('🚨 Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof BaseException) {
      ErrorHandlerMiddleware.handleBaseException(error, res);
      return;
    }

    if (error instanceof ZodError) {
      ErrorHandlerMiddleware.handleZodError(error, res);
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      ErrorHandlerMiddleware.handleJwtError(error, res);
      return;
    }

    if (error.name === 'TokenExpiredError') {
      ErrorHandlerMiddleware.handleJwtExpiredError(error, res);
      return;
    }

    if (error.name === 'SyntaxError' && 'body' in error) {
      ErrorHandlerMiddleware.handleSyntaxError(error, res);
      return;
    }

    // Default error handler
    ErrorHandlerMiddleware.handleUnknownError(error, res);
  }

  private static handleBaseException(error: BaseException, res: Response): void {
    const response = ApiResponse.error(
      error.message,
      error.statusCode,
      error instanceof ValidationException ? error.errors : undefined
    );

    res.status(error.statusCode).json(response.toJSON());
  }

  private static handleZodError(error: ZodError, res: Response): void {
    const errors: Record<string, string[]> = {};

    error.issues.forEach((err: any) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });

    const response = ApiResponse.badRequest('Validation failed', errors);
    res.status(400).json(response.toJSON());
  }

  private static handleJwtError(error: Error, res: Response): void {
    const response = ApiResponse.unauthorized('Invalid token');
    res.status(401).json(response.toJSON());
  }

  private static handleJwtExpiredError(error: Error, res: Response): void {
    const response = ApiResponse.unauthorized('Token expired');
    res.status(401).json(response.toJSON());
  }

  private static handleSyntaxError(error: Error, res: Response): void {
    const response = ApiResponse.badRequest('Invalid JSON in request body');
    res.status(400).json(response.toJSON());
  }

  private static handleUnknownError(error: Error, res: Response): void {
    const response = ApiResponse.internalError(
      process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    );

    res.status(500).json(response.toJSON());
  }
}
