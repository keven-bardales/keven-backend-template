import {
  UnauthorizedException,
  NotFoundException,
} from '../../../../shared/domain/exceptions/global-exceptions';
import { LoginUseCase, LoginRequest, LoginResponse } from '../../domain/use-cases/login.use-case';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { PasswordService } from '../../../users/domain/services/password.service';
import { TokenService } from '../../domain/services/token.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';

export class LoginUseCaseImpl extends LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository
  ) {
    super();
  }

  public async execute(request: LoginRequest): Promise<LoginResponse> {
    this.log('User attempting to login', { email: request.email });

    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(request.email);
      if (!user) {
        this.log('Login failed: User not found', { email: request.email });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        this.log('Login failed: User is inactive', { userId: user.id });
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.passwordService.compare(
        request.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        this.log('Login failed: Invalid password', { userId: user.id });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Create token pair and session
      const tokenResult = await this.tokenService.createTokenPair(
        user.id,
        request.deviceInfo,
        request.ipAddress
      );

      // Create login session
      const session = await this.authRepository.createSession({
        userId: user.id,
        accessTokenId: tokenResult.tokenPair.accessToken.id,
        refreshTokenId: tokenResult.tokenPair.refreshToken.id,
        deviceInfo: request.deviceInfo,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      });

      const loginResult = {
        session,
        tokens: tokenResult.tokenPair,
        accessTokenJwt: tokenResult.accessTokenJwt,
        refreshTokenJwt: tokenResult.refreshTokenJwt,
      };

      this.log('User logged in successfully', {
        userId: user.id,
        sessionId: session.id,
      });

      return {
        result: loginResult,
        user: {
          id: user.id,
          email: user.email.getValue(),
          firstName: user.firstName,
          lastName: user.lastName,
          mustChangePassword: user.mustChangePassword,
        },
      };
    } catch (error) {
      this.logError('Login failed', error);
      throw error;
    }
  }
}
