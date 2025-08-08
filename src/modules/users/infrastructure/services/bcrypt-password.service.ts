/* eslint-disable no-useless-escape */
import bcrypt from 'bcrypt';
import {
  PasswordService,
  PasswordValidationService,
  PasswordValidationResult,
} from '../../domain/services/password.service';
import { EnvironmentConfigService } from '../../../../shared/infrastructure/config/environment.config';
import { InternalServerErrorException } from '../../../../shared/domain/exceptions/global-exceptions';

export class BcryptPasswordService extends PasswordService {
  private readonly saltRounds: number;

  constructor() {
    super();
    const envConfig = EnvironmentConfigService.getInstance().get();
    this.saltRounds = envConfig.BCRYPT_SALT_ROUNDS;
  }

  public async hash(password: string): Promise<string> {
    try {
      this.log('Hashing password');
      const hash = await bcrypt.hash(password, this.saltRounds);
      this.log('Password hashed successfully');
      return hash;
    } catch (error) {
      this.logError('Failed to hash password', error);
      throw new InternalServerErrorException('Failed to process password');
    }
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    try {
      this.log('Comparing password with hash');
      const isMatch = await bcrypt.compare(password, hash);
      this.log('Password comparison completed', { isMatch });
      return isMatch;
    } catch (error) {
      this.logError('Failed to compare password', error);
      throw new InternalServerErrorException('Failed to verify password');
    }
  }

  public generateRandomPassword(length: number = 16): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';

    // Ensure at least one character from each required type
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  public async isPasswordCompromised(password: string): Promise<boolean> {
    // In a real implementation, this would check against services like HaveIBeenPwned
    // For now, we'll implement a basic check against common passwords
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  public getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain numbers');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain special characters');
    }

    // Additional checks
    if (!/(.)\1{2,}/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should not contain repeated characters');
    }

    const isValid = score >= 4 && password.length >= 8;

    return {
      score,
      feedback,
      isValid,
    };
  }
}

export class BcryptPasswordValidationService extends PasswordValidationService {
  private readonly passwordService: BcryptPasswordService;

  constructor(passwordService: BcryptPasswordService) {
    super();
    this.passwordService = passwordService;
  }

  public validate(password: string): PasswordValidationResult {
    const strengthResult = this.passwordService.getPasswordStrength(password);

    let strength: 'weak' | 'medium' | 'strong';
    if (strengthResult.score <= 2) {
      strength = 'weak';
    } else if (strengthResult.score <= 4) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return {
      isValid: strengthResult.isValid,
      errors: strengthResult.feedback,
      strength,
    };
  }

  public async validatePasswordChange(
    currentPassword: string,
    newPassword: string,
    userPasswordHistory?: string[]
  ): Promise<PasswordValidationResult> {
    const basicValidation = this.validate(newPassword);

    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // Check if new password is the same as current
    if (currentPassword === newPassword) {
      return {
        isValid: false,
        errors: ['New password must be different from current password'],
        strength: basicValidation.strength,
      };
    }

    // Check against password history (if provided)
    if (userPasswordHistory && userPasswordHistory.length > 0) {
      for (const historyHash of userPasswordHistory) {
        const isSameAsHistory = await this.passwordService.compare(newPassword, historyHash);
        if (isSameAsHistory) {
          return {
            isValid: false,
            errors: ['Password has been used recently and cannot be reused'],
            strength: basicValidation.strength,
          };
        }
      }
    }

    // Check if password is compromised
    const isCompromised = await this.passwordService.isPasswordCompromised(newPassword);
    if (isCompromised) {
      return {
        isValid: false,
        errors: ['Password has been found in data breaches and cannot be used'],
        strength: basicValidation.strength,
      };
    }

    return basicValidation;
  }
}
