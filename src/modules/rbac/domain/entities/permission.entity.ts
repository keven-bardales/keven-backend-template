import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { UUID } from '../../../../shared/domain/value-objects/uuid.value-object';
import { DomainException } from '../../../../shared/domain/exceptions/global-exceptions';

export interface PermissionProps {
  id: string;
  moduleId: string;
  action: string;
  scope?: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PermissionEntity extends BaseEntity {
  public readonly moduleId: string;
  public readonly action: string;
  public readonly scope?: string;
  public readonly name: string;
  public readonly description?: string;

  constructor(props: PermissionProps) {
    super(props.id, props.createdAt, props.updatedAt);

    this.moduleId = props.moduleId;
    this.action = props.action;
    this.scope = props.scope;
    this.name = props.name;
    this.description = props.description;

    this.validate();
  }

  public static create(data: {
    moduleId: string;
    action: string;
    scope?: string;
    name: string;
    description?: string;
  }): PermissionEntity {
    const now = new Date();

    return new PermissionEntity({
      id: UUID.generate().getValue(),
      moduleId: data.moduleId,
      action: data.action,
      scope: data.scope,
      name: data.name,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(data: {
    id: string;
    moduleId: string;
    action: string;
    scope?: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  }): PermissionEntity {
    return new PermissionEntity({
      id: data.id,
      moduleId: data.moduleId,
      action: data.action,
      scope: data.scope,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  public update(data: { name?: string; description?: string }): PermissionEntity {
    return new PermissionEntity({
      id: this.id,
      moduleId: this.moduleId,
      action: this.action,
      scope: this.scope,
      name: data.name || this.name,
      description: data.description !== undefined ? data.description : this.description,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public getFullPermissionKey(): string {
    return this.scope ? `${this.action}:${this.scope}` : this.action;
  }

  public matches(action: string, scope?: string): boolean {
    if (this.action !== action) {
      return false;
    }

    // If permission has no scope, it matches any scope
    if (!this.scope) {
      return true;
    }

    // If permission has scope, it must match exactly
    return this.scope === scope;
  }

  private validate(): void {
    if (!this.moduleId || this.moduleId.trim().length === 0) {
      throw new DomainException('Module ID is required');
    }

    if (!this.action || this.action.trim().length === 0) {
      throw new DomainException('Permission action is required');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new DomainException('Permission name is required');
    }

    if (this.action.length > 50) {
      throw new DomainException('Permission action cannot exceed 50 characters');
    }

    if (this.scope && this.scope.length > 50) {
      throw new DomainException('Permission scope cannot exceed 50 characters');
    }

    if (this.name.length > 100) {
      throw new DomainException('Permission name cannot exceed 100 characters');
    }

    if (this.description && this.description.length > 255) {
      throw new DomainException('Permission description cannot exceed 255 characters');
    }
  }

  public toJSON() {
    return {
      id: this.id,
      moduleId: this.moduleId,
      action: this.action,
      scope: this.scope,
      name: this.name,
      description: this.description,
      fullPermissionKey: this.getFullPermissionKey(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
