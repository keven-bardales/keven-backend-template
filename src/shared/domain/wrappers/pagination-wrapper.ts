export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export class PaginationMeta {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly totalCount: number,
    public readonly totalPages: number,
    public readonly hasNextPage: boolean,
    public readonly hasPreviousPage: boolean
  ) {}

  public static create(page: number, limit: number, totalCount: number): PaginationMeta {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return new PaginationMeta(page, limit, totalCount, totalPages, hasNextPage, hasPreviousPage);
  }

  public toJSON(): object {
    return {
      page: this.page,
      limit: this.limit,
      totalCount: this.totalCount,
      totalPages: this.totalPages,
      hasNextPage: this.hasNextPage,
      hasPreviousPage: this.hasPreviousPage,
    };
  }
}

export class PaginatedResult<T> {
  constructor(
    public readonly data: T[],
    public readonly meta: PaginationMeta
  ) {}

  public static create<T>(
    data: T[],
    page: number,
    limit: number,
    totalCount: number
  ): PaginatedResult<T> {
    const meta = PaginationMeta.create(page, limit, totalCount);
    return new PaginatedResult(data, meta);
  }

  public toJSON(): object {
    return {
      data: this.data,
      meta: this.meta.toJSON(),
    };
  }
}

export class PaginationHelper {
  public static validateOptions(options: Partial<PaginationOptions>): PaginationOptions {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));

    return {
      page,
      limit,
      orderBy: options.orderBy,
    };
  }

  public static getSkipTake(page: number, limit: number): { skip: number; take: number } {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }
}
