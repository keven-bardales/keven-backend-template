export interface ErrorItem {
  type: string;
  code: string;
  message: string;
  field?: string;
  critical: boolean;
}

export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly data: T | null;
  public readonly errors: ErrorItem[];

  private constructor(isSuccess: boolean, data: T | null, errors: ErrorItem[]) {
    this.isSuccess = isSuccess;
    this.data = data;
    this.errors = errors;
  }

  public get isFailure(): boolean {
    return !this.isSuccess;
  }

  public get criticalErrors(): ErrorItem[] {
    return this.errors.filter(error => error.critical);
  }

  public get nonCriticalErrors(): ErrorItem[] {
    return this.errors.filter(error => !error.critical);
  }

  public get hasCriticalErrors(): boolean {
    return this.criticalErrors.length > 0;
  }

  public get hasNonCriticalErrors(): boolean {
    return this.nonCriticalErrors.length > 0;
  }

  public static success<T>(data: T): Result<T> {
    return new Result<T>(true, data, []);
  }

  public static successWithWarnings<T>(data: T, warnings: ErrorItem[]): Result<T> {
    const nonCriticalWarnings = warnings.map(w => ({ ...w, critical: false }));
    return new Result<T>(true, data, nonCriticalWarnings);
  }

  public static failure<T>(errors: ErrorItem[]): Result<T> {
    return new Result<T>(false, null, errors);
  }

  public static failureFromError<T>(error: Error, code: string = 'UNKNOWN_ERROR'): Result<T> {
    return new Result<T>(false, null, [
      {
        type: error.constructor.name,
        code,
        message: error.message,
        critical: true,
      },
    ]);
  }

  public static combine<T>(results: Result<T>[]): Result<T[]> {
    const data: T[] = [];
    const errors: ErrorItem[] = [];

    for (const result of results) {
      if (result.isSuccess && result.data !== null) {
        data.push(result.data);
      }
      errors.push(...result.errors);
    }

    if (errors.some(e => e.critical)) {
      return Result.failure<T[]>(errors);
    }

    return errors.length > 0 ? Result.successWithWarnings(data, errors) : Result.success(data);
  }

  public map<U>(fn: (value: T) => U): Result<U> {
    if (this.isSuccess && this.data !== null) {
      try {
        const newData = fn(this.data);
        return this.errors.length > 0
          ? Result.successWithWarnings(newData, this.errors)
          : Result.success(newData);
      } catch (error) {
        return Result.failureFromError<U>(error as Error);
      }
    }
    return Result.failure<U>(this.errors);
  }

  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isSuccess && this.data !== null) {
      try {
        const newResult = fn(this.data);
        const combinedErrors = [...this.errors, ...newResult.errors];

        if (newResult.isSuccess && newResult.data !== null) {
          return combinedErrors.length > 0
            ? Result.successWithWarnings(newResult.data, combinedErrors)
            : Result.success(newResult.data);
        }

        return Result.failure<U>(combinedErrors);
      } catch (error) {
        return Result.failureFromError<U>(error as Error);
      }
    }
    return Result.failure<U>(this.errors);
  }

  public getOrThrow(): T {
    if (this.isSuccess && this.data !== null) {
      return this.data;
    }

    const errorMessage = this.errors.map(e => `[${e.code}] ${e.message}`).join(', ');

    throw new Error(errorMessage || 'Result contains no data');
  }

  public getOrDefault(defaultValue: T): T {
    return this.isSuccess && this.data !== null ? this.data : defaultValue;
  }

  public toApiResponse(statusCode?: number): {
    success: boolean;
    data: T | null;
    errors: ErrorItem[];
    timestamp: string;
  } {
    return {
      success: this.isSuccess,
      data: this.data,
      errors: this.errors,
      timestamp: new Date().toISOString(),
    };
  }
}
