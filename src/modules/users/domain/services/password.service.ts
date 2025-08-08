import { BaseService } from '../../../../shared/domain/services/base.service';

export abstract class PasswordService extends BaseService {
  abstract hash(password: string): Promise<string>;
  abstract compare(password: string, hash: string): Promise<boolean>;
  abstract generateRandomPassword(length?: number): string;
  abstract isPasswordCompromised(password: string): Promise<boolean>;
  abstract getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  };
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export abstract class PasswordValidationService extends BaseService {
  abstract validate(password: string): PasswordValidationResult;
  abstract validatePasswordChange(
    currentPassword: string,
    newPassword: string,
    userPasswordHistory?: string[]
  ): Promise<PasswordValidationResult>;
}
