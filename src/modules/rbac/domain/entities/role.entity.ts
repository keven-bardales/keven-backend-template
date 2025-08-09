import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { UUID } from '../../../../shared/domain/value-objects/uuid.value-object';
import { DomainException } from '../../../../shared/domain/exceptions/global-exceptions';

export interface RoleProps {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RoleEntity extends BaseEntity {
  public readonly name: string;
  public readonly description?: string;
  public readonly isSystem: boolean;

  constructor(props: RoleProps) {
    super(props.id, props.createdAt, props.updatedAt);

    this.name = props.name;
    this.description = props.description;
    this.isSystem = props.isSystem;

    this.validate();
  }

  public static create(data: {
    name: string;
    description?: string;
    isSystem?: boolean;
  }): RoleEntity {
    const now = new Date();

    return new RoleEntity({
      id: UUID.generate().getValue(),
      name: data.name,
      description: data.description,
      isSystem: data.isSystem || false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(data: {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): RoleEntity {
    return new RoleEntity({
      id: data.id,
      name: data.name,
      description: data.description,
      isSystem: data.isSystem,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  public update(data: { name?: string; description?: string }): RoleEntity {
    if (this.isSystem) {
      throw new DomainException('System roles cannot be modified');
    }

    return new RoleEntity({
      id: this.id,
      name: data.name || this.name,
      description: data.description !== undefined ? data.description : this.description,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public canBeDeleted(): boolean {
    return !this.isSystem;
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new DomainException('Role name is required');
    }

    if (this.name.length > 50) {
      throw new DomainException('Role name cannot exceed 50 characters');
    }

    if (this.description && this.description.length > 255) {
      throw new DomainException('Role description cannot exceed 255 characters');
    }
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
