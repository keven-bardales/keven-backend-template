import { BadRequestException } from '../../../../shared/domain/exceptions/global-exceptions';

export class CreateRoleDto {
  public readonly name: string;
  public readonly description?: string;
  public readonly isSystem?: boolean;

  constructor(data: any) {
    this.name = data?.name?.trim();
    this.description = data?.description?.trim();
    this.isSystem = data?.isSystem === true;

    this.validate();
  }

  private validate(): void {
    if (!this.name) {
      throw new BadRequestException('Role name is required');
    }

    if (this.name.length > 50) {
      throw new BadRequestException('Role name cannot exceed 50 characters');
    }

    if (this.description && this.description.length > 255) {
      throw new BadRequestException('Role description cannot exceed 255 characters');
    }
  }
}
