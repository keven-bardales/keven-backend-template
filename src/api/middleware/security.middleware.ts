import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export class SecurityMiddleware {
  /**
   * Configure Helmet security middleware with comprehensive security headers
   */
  public static configure() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          fontSrc: ["'self'", 'fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
        },
      },

      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: { policy: 'cross-origin' },

      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },

      // Frame Guard
      frameguard: { action: 'deny' },

      // Hide Powered-By header
      hidePoweredBy: true,

      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // IE No Open
      ieNoOpen: true,

      // No Sniff
      noSniff: true,

      // Origin Agent Cluster
      originAgentCluster: true,

      // Permissive Cross-Domain Policy
      permittedCrossDomainPolicies: false,

      // Referrer Policy
      referrerPolicy: { policy: 'no-referrer' },

      // X-XSS-Protection
      xssFilter: true,
    });
  }

  /**
   * Additional security headers middleware
   */
  public static additionalHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Server information hiding
      res.removeHeader('X-Powered-By');
      res.setHeader('Server', 'Keven-Backend');

      // Additional security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      // Cache control for security-sensitive responses
      if (req.path.includes('/auth') || req.path.includes('/api')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      next();
    };
  }
}
