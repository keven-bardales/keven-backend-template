import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { UUID } from '../../../../shared/domain/value-objects/uuid.value-object';
import { DomainException } from '../../../../shared/domain/exceptions/global-exceptions';

export interface ModuleProps {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ModuleEntity extends BaseEntity {
  public readonly name: string;
  public readonly description?: string;
  public readonly isActive: boolean;

  constructor(props: ModuleProps) {
    super(props.id, props.createdAt, props.updatedAt);

    this.name = props.name;
    this.description = props.description;
    this.isActive = props.isActive;

    this.validate();
  }

  public static create(data: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): ModuleEntity {
    const now = new Date();

    return new ModuleEntity({
      id: UUID.generate().getValue(),
      name: data.name,
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(data: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ModuleEntity {
    return new ModuleEntity({
      id: data.id,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  public update(data: { name?: string; description?: string; isActive?: boolean }): ModuleEntity {
    return new ModuleEntity({
      id: this.id,
      name: data.name || this.name,
      description: data.description !== undefined ? data.description : this.description,
      isActive: data.isActive !== undefined ? data.isActive : this.isActive,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public activate(): ModuleEntity {
    if (this.isActive) {
      return this;
    }

    return this.update({ isActive: true });
  }

  public deactivate(): ModuleEntity {
    if (!this.isActive) {
      return this;
    }

    return this.update({ isActive: false });
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new DomainException('Module name is required');
    }

    if (this.name.length > 50) {
      throw new DomainException('Module name cannot exceed 50 characters');
    }

    if (this.description && this.description.length > 255) {
      throw new DomainException('Module description cannot exceed 255 characters');
    }
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
