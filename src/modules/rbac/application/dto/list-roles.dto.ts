import { BadRequestException } from '../../../../shared/domain/exceptions/global-exceptions';

export class ListRolesDto {
  public readonly skip: number;
  public readonly take: number;
  public readonly includeSystem?: boolean;
  public readonly searchTerm?: string;

  constructor(query: any) {
    this.skip = parseInt(query?.skip) || 0;
    this.take = Math.min(parseInt(query?.take) || 20, 100); // Max 100 items per request
    this.includeSystem =
      query?.includeSystem === 'true' ? true : query?.includeSystem === 'false' ? false : undefined;
    this.searchTerm = query?.searchTerm?.trim();

    this.validate();
  }

  private validate(): void {
    if (this.skip < 0) {
      throw new BadRequestException('Skip value must be non-negative');
    }

    if (this.take <= 0 || this.take > 100) {
      throw new BadRequestException('Take value must be between 1 and 100');
    }

    if (this.searchTerm && this.searchTerm.length > 100) {
      throw new BadRequestException('Search term cannot exceed 100 characters');
    }
  }
}
