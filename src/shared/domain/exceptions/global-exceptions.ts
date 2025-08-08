export abstract class BaseException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: Date;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

export class BadRequestException extends BaseException {
  constructor(message: string = 'Bad Request', code: string = 'BAD_REQUEST') {
    super(message, code, 400);
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, code, 401);
  }
}

export class ForbiddenException extends BaseException {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, code, 403);
  }
}

export class NotFoundException extends BaseException {
  constructor(message: string = 'Not Found', code: string = 'NOT_FOUND') {
    super(message, code, 404);
  }
}

export class ConflictException extends BaseException {
  constructor(message: string = 'Conflict', code: string = 'CONFLICT') {
    super(message, code, 409);
  }
}

export class UnprocessableEntityException extends BaseException {
  constructor(message: string = 'Unprocessable Entity', code: string = 'UNPROCESSABLE_ENTITY') {
    super(message, code, 422);
  }
}

export class InternalServerErrorException extends BaseException {
  constructor(message: string = 'Internal Server Error', code: string = 'INTERNAL_SERVER_ERROR') {
    super(message, code, 500);
  }
}

export class ValidationException extends BaseException {
  public readonly errors: Record<string, string[]>;

  constructor(
    errors: Record<string, string[]>,
    message: string = 'Validation failed',
    code: string = 'VALIDATION_ERROR'
  ) {
    super(message, code, 400);
    this.errors = errors;
  }

  public toJSON(): object {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

export class DomainException extends BaseException {
  constructor(message: string, code: string = 'DOMAIN_ERROR') {
    super(message, code, 400);
  }
}
