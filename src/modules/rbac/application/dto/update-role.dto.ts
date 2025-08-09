import { BadRequestException } from '../../../../shared/domain/exceptions/global-exceptions';

export class UpdateRoleDto {
  public readonly name?: string;
  public readonly description?: string;

  constructor(data: any) {
    this.name = data?.name?.trim();
    this.description = data?.description?.trim();

    this.validate();
  }

  private validate(): void {
    if (this.name && this.name.length > 50) {
      throw new BadRequestException('Role name cannot exceed 50 characters');
    }

    if (this.description && this.description.length > 255) {
      throw new BadRequestException('Role description cannot exceed 255 characters');
    }
  }
}
