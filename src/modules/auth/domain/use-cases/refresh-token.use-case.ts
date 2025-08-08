import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export abstract class RefreshTokenUseCase extends BaseUseCase<
  RefreshTokenRequest,
  RefreshTokenResponse
> {
  abstract execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
}
