import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

export abstract class RegisterUseCase extends BaseUseCase<RegisterRequest, RegisterResponse> {
  abstract execute(request: RegisterRequest): Promise<RegisterResponse>;
}
