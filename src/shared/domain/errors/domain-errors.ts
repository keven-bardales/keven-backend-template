export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly critical: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly critical = true;

  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly critical = true;

  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly critical = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly critical = true;

  constructor(
    message: string,
    public readonly resource?: string
  ) {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly critical = true;

  constructor(
    message: string,
    public readonly conflictingField?: string
  ) {
    super(message);
  }
}

export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly critical = true;

  constructor(
    message: string,
    public readonly rule?: string
  ) {
    super(message);
  }
}

export class ExternalServiceError extends DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly critical = true;

  constructor(
    message: string,
    public readonly service?: string
  ) {
    super(message);
  }
}

export class DatabaseError extends DomainError {
  readonly code = 'DATABASE_ERROR';
  readonly critical = true;

  constructor(
    message: string,
    public readonly operation?: string
  ) {
    super(message);
  }
}

export class ConcurrencyError extends DomainError {
  readonly code = 'CONCURRENCY_ERROR';
  readonly critical = true;

  constructor(message: string = 'Resource was modified by another process') {
    super(message);
  }
}

export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly critical = false;

  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message);
  }
}

export class TokenExpiredError extends DomainError {
  readonly code = 'TOKEN_EXPIRED';
  readonly critical = true;

  constructor(message: string = 'Token has expired') {
    super(message);
  }
}

export class InvalidTokenError extends DomainError {
  readonly code = 'INVALID_TOKEN';
  readonly critical = true;

  constructor(message: string = 'Invalid token') {
    super(message);
  }
}

export class PasswordMismatchError extends DomainError {
  readonly code = 'PASSWORD_MISMATCH';
  readonly critical = true;

  constructor(message: string = 'Password does not match') {
    super(message);
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = 'WEAK_PASSWORD';
  readonly critical = true;

  constructor(
    message: string,
    public readonly requirements?: string[]
  ) {
    super(message);
  }
}

export class AccountLockedError extends DomainError {
  readonly code = 'ACCOUNT_LOCKED';
  readonly critical = true;

  constructor(
    message: string = 'Account is locked',
    public readonly lockedUntil?: Date
  ) {
    super(message);
  }
}

export class EmailNotVerifiedError extends DomainError {
  readonly code = 'EMAIL_NOT_VERIFIED';
  readonly critical = true;

  constructor(message: string = 'Email address is not verified') {
    super(message);
  }
}

export class InsufficientPermissionsError extends DomainError {
  readonly code = 'INSUFFICIENT_PERMISSIONS';
  readonly critical = true;

  constructor(
    message: string = 'Insufficient permissions',
    public readonly requiredPermissions?: string[]
  ) {
    super(message);
  }
}

export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT';
  readonly critical = true;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
  }
}

export class OperationNotAllowedError extends DomainError {
  readonly code = 'OPERATION_NOT_ALLOWED';
  readonly critical = true;

  constructor(
    message: string,
    public readonly reason?: string
  ) {
    super(message);
  }
}
