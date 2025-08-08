export abstract class BaseUseCase<TRequest, TResponse> {
  protected readonly useCaseName: string;

  constructor() {
    this.useCaseName = this.constructor.name;
  }

  abstract execute(request: TRequest): Promise<TResponse>;

  protected log(message: string, data?: any): void {
    console.log(`[${this.useCaseName}] ${message}`, data || '');
  }

  protected logError(message: string, error?: any): void {
    console.error(`[${this.useCaseName}] ERROR: ${message}`, error || '');
  }
}
