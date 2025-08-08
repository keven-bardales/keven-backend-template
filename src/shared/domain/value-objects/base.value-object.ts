export abstract class ValueObject<T> {
  constructor(protected readonly value: T) {
    this.validate(value);
  }

  protected abstract validate(value: T): void;

  public getValue(): T {
    return this.value;
  }

  public equals(other: ValueObject<T>): boolean {
    if (this.constructor !== other.constructor) {
      return false;
    }
    return this.value === other.value;
  }

  public toString(): string {
    return String(this.value);
  }
}
