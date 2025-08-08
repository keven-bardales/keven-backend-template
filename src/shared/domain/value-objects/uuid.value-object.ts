import { ValueObject } from './base.value-object';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

export class UUID extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value) {
      throw new Error('UUID cannot be empty');
    }

    if (typeof value !== 'string') {
      throw new Error('UUID must be a string');
    }

    if (!validateUuid(value)) {
      throw new Error('Invalid UUID format');
    }
  }

  public static create(uuid?: string): UUID {
    return new UUID(uuid || uuidv4());
  }

  public static generate(): UUID {
    return new UUID(uuidv4());
  }

  public static isValid(value: string): boolean {
    try {
      new UUID(value);
      return true;
    } catch {
      return false;
    }
  }
}
