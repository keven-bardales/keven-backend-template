import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Extend Request interface to include rateLimit property using module augmentation
declare module 'express-serve-static-core' {
  interface Request {
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime: number;
    };
  }
}

export class RateLimitMiddleware {
  /**
   * General rate limiting for all API endpoints
   */
  public static general() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        status: 'error',
        statusCode: 429,
        message: 'Too many requests, please try again later.',
        data: null,
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: 'Too many requests from this IP, please try again later.',
          data: req.rateLimit
            ? {
                retryAfter: Math.round(req.rateLimit.resetTime / 1000),
                limit: req.rateLimit.limit,
                current: req.rateLimit.current,
                remaining: req.rateLimit.remaining,
              }
            : null,
        });
      },
    });
  }

  /**
   * Strict rate limiting for authentication endpoints
   */
  public static auth() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 auth requests per windowMs
      message: {
        status: 'error',
        statusCode: 429,
        message: 'Too many authentication attempts, please try again later.',
        data: null,
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false, // Don't skip successful requests
      skipFailedRequests: false, // Don't skip failed requests
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: 'Too many authentication attempts from this IP, please try again later.',
          data: req.rateLimit
            ? {
                retryAfter: Math.round(req.rateLimit.resetTime / 1000),
                limit: req.rateLimit.limit,
                current: req.rateLimit.current,
                remaining: req.rateLimit.remaining,
              }
            : null,
        });
      },
    });
  }

  /**
   * Very strict rate limiting for password reset and sensitive operations
   */
  public static sensitive() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // Limit each IP to 5 sensitive requests per hour
      message: {
        status: 'error',
        statusCode: 429,
        message: 'Too many sensitive requests, please try again later.',
        data: null,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: 'Too many sensitive requests from this IP, please try again later.',
          data: req.rateLimit
            ? {
                retryAfter: Math.round(req.rateLimit.resetTime / 1000),
                limit: req.rateLimit.limit,
                current: req.rateLimit.current,
                remaining: req.rateLimit.remaining,
              }
            : null,
        });
      },
    });
  }

  /**
   * Moderate rate limiting for user management endpoints
   */
  public static users() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 30, // Limit each IP to 30 user requests per windowMs
      message: {
        status: 'error',
        statusCode: 429,
        message: 'Too many user management requests, please try again later.',
        data: null,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: 'Too many user management requests from this IP, please try again later.',
          data: req.rateLimit
            ? {
                retryAfter: Math.round(req.rateLimit.resetTime / 1000),
                limit: req.rateLimit.limit,
                current: req.rateLimit.current,
                remaining: req.rateLimit.remaining,
              }
            : null,
        });
      },
    });
  }

  /**
   * Rate limiting for RBAC operations
   */
  public static rbac() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // Limit each IP to 20 RBAC requests per windowMs
      message: {
        status: 'error',
        statusCode: 429,
        message: 'Too many RBAC requests, please try again later.',
        data: null,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: 'Too many RBAC requests from this IP, please try again later.',
          data: req.rateLimit
            ? {
                retryAfter: Math.round(req.rateLimit.resetTime / 1000),
                limit: req.rateLimit.limit,
                current: req.rateLimit.current,
                remaining: req.rateLimit.remaining,
              }
            : null,
        });
      },
    });
  }
}
