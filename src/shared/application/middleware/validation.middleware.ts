import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationException } from '../../domain/exceptions/global-exceptions';

export type ValidationTarget = 'body' | 'params' | 'query';

export class ValidationMiddleware {
  public static validate(schema: ZodSchema, target: ValidationTarget = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const dataToValidate = ValidationMiddleware.getDataToValidate(req, target);
        const validatedData = schema.parse(dataToValidate);

        // Replace the original data with validated data
        ValidationMiddleware.setValidatedData(req, target, validatedData);

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static validateMultiple(
    validations: Array<{ schema: ZodSchema; target: ValidationTarget }>
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const errors: Record<string, string[]> = {};
        let hasErrors = false;

        for (const { schema, target } of validations) {
          try {
            const dataToValidate = ValidationMiddleware.getDataToValidate(req, target);
            const validatedData = schema.parse(dataToValidate);
            ValidationMiddleware.setValidatedData(req, target, validatedData);
          } catch (error: any) {
            hasErrors = true;
            if (error.errors) {
              error.errors.forEach((err: any) => {
                const path = `${target}.${err.path.join('.')}`;
                if (!errors[path]) {
                  errors[path] = [];
                }
                errors[path].push(err.message);
              });
            }
          }
        }

        if (hasErrors) {
          throw new ValidationException(errors);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private static getDataToValidate(req: Request, target: ValidationTarget): any {
    switch (target) {
      case 'body':
        return req.body;
      case 'params':
        return req.params;
      case 'query':
        return req.query;
      default:
        throw new Error(`Invalid validation target: ${target}`);
    }
  }

  private static setValidatedData(req: Request, target: ValidationTarget, data: any): void {
    switch (target) {
      case 'body':
        req.body = data;
        break;
      case 'params':
        req.params = data;
        break;
      case 'query':
        // Instead of replacing req.query, we'll extend the request object with validated query data
        (req as any).validatedQuery = data;
        // Also merge back into req.query for backward compatibility (where possible)
        Object.keys(data).forEach(key => {
          if (req.query && typeof req.query === 'object') {
            (req.query as any)[key] = data[key];
          }
        });
        break;
      default:
        throw new Error(`Invalid validation target: ${target}`);
    }
  }
}

// Helper function to create validation middleware
export const validate = ValidationMiddleware.validate;
export const validateMultiple = ValidationMiddleware.validateMultiple;
