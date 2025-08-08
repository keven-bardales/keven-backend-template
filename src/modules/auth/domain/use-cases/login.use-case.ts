import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';
import { LoginResult } from '../services/token.service';

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  result: LoginResult;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
  };
}

export abstract class LoginUseCase extends BaseUseCase<LoginRequest, LoginResponse> {
  abstract execute(request: LoginRequest): Promise<LoginResponse>;
}
