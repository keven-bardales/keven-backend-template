import compression from 'compression';
import { Request, Response } from 'express';

export class CompressionMiddleware {
  public static configure() {
    return compression({
      // Only compress responses that are larger than this threshold
      threshold: 1024,

      // Compression level (0-9, where 9 is highest compression but slowest)
      level: 6,

      // Only compress specific mime types
      filter: (req: Request, res: Response) => {
        // Don't compress if the client doesn't support compression
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Use the default compression filter for other cases
        return compression.filter(req, res);
      },

      // Memory level (1-9, where 9 uses maximum memory for optimal speed)
      memLevel: 8,
    });
  }
}
