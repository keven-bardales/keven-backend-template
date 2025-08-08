export abstract class BaseEntity {
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public equals(entity: BaseEntity): boolean {
    return this.id === entity.id;
  }

  public toString(): string {
    return `${this.constructor.name}(${this.id})`;
  }
}
