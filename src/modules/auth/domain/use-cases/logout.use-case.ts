import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';

export interface LogoutRequest {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  logoutAllSessions?: boolean;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export abstract class LogoutUseCase extends BaseUseCase<LogoutRequest, LogoutResponse> {
  abstract execute(request: LogoutRequest): Promise<LogoutResponse>;
}
