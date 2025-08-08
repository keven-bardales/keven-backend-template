import { ValueObject } from './base.value-object';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export class Email extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value) {
      throw new Error('Email cannot be empty');
    }

    if (typeof value !== 'string') {
      throw new Error('Email must be a string');
    }

    if (!EMAIL_REGEX.test(value)) {
      throw new Error('Invalid email format');
    }

    if (value.length > 254) {
      throw new Error('Email is too long');
    }
  }

  public static create(email: string): Email {
    return new Email(email.toLowerCase().trim());
  }

  public getDomain(): string {
    return this.value.split('@')[1];
  }

  public getLocalPart(): string {
    return this.value.split('@')[0];
  }
}
