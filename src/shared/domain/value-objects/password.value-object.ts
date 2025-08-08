/* eslint-disable no-useless-escape */
import { ValueObject } from './base.value-object';

export class Password extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value) {
      throw new Error('Password cannot be empty');
    }

    if (typeof value !== 'string') {
      throw new Error('Password must be a string');
    }

    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (value.length > 128) {
      throw new Error('Password is too long');
    }

    if (!/(?=.*[a-z])/.test(value)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(value)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(value)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(value)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  public static create(password: string): Password {
    return new Password(password);
  }

  public getStrength(): 'weak' | 'medium' | 'strong' {
    const value = this.getValue();
    let score = 0;

    if (value.length >= 12) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) score++;
    if (value.length >= 16) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }
}
