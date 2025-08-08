export abstract class BaseService {
  protected readonly serviceName: string;

  constructor() {
    this.serviceName = this.constructor.name;
  }

  protected log(message: string, data?: any): void {
    console.log(`[${this.serviceName}] ${message}`, data || '');
  }

  protected logError(message: string, error?: any): void {
    console.error(`[${this.serviceName}] ERROR: ${message}`, error || '');
  }
}
