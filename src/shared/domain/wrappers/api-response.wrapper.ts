export class ApiResponse<T> {
  constructor(
    public readonly success: boolean,
    public readonly data: T | null,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly timestamp: Date = new Date(),
    public readonly errors?: Record<string, string[]>
  ) {}

  public static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): ApiResponse<T> {
    return new ApiResponse(true, data, message, statusCode);
  }

  public static error<T = null>(
    message: string,
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ): ApiResponse<T> {
    return new ApiResponse(false, null as T, message, statusCode, new Date(), errors);
  }

  public static created<T>(data: T, message: string = 'Created successfully'): ApiResponse<T> {
    return new ApiResponse(true, data, message, 201);
  }

  public static noContent(message: string = 'No content'): ApiResponse<null> {
    return new ApiResponse(true, null, message, 204);
  }

  public static badRequest(
    message: string = 'Bad request',
    errors?: Record<string, string[]>
  ): ApiResponse<null> {
    return new ApiResponse(false, null, message, 400, new Date(), errors);
  }

  public static unauthorized(message: string = 'Unauthorized'): ApiResponse<null> {
    return new ApiResponse(false, null, message, 401);
  }

  public static forbidden(message: string = 'Forbidden'): ApiResponse<null> {
    return new ApiResponse(false, null, message, 403);
  }

  public static notFound(message: string = 'Not found'): ApiResponse<null> {
    return new ApiResponse(false, null, message, 404);
  }

  public static conflict(message: string = 'Conflict'): ApiResponse<null> {
    return new ApiResponse(false, null, message, 409);
  }

  public static internalError(message: string = 'Internal server error'): ApiResponse<null> {
    return new ApiResponse(false, null, message, 500);
  }

  public toJSON(): object {
    return {
      success: this.success,
      data: this.data,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.errors && { errors: this.errors }),
    };
  }
}
