import { z } from 'zod';

const GetUsersDtoSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(val => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(val => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
    }),
  searchTerm: z
    .string()
    .optional()
    .transform(val => val?.trim() || undefined),
  includeInactive: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  orderBy: z
    .string()
    .optional()
    .default('createdAt')
    .refine(val => ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'].includes(val), {
      message: 'Invalid orderBy field',
    }),
  orderDirection: z
    .string()
    .optional()
    .default('desc')
    .transform(val => (val === 'asc' ? 'asc' : 'desc')),
});

export type GetUsersDtoType = z.infer<typeof GetUsersDtoSchema>;

export class GetUsersDto {
  public readonly page: number;
  public readonly limit: number;
  public readonly searchTerm?: string;
  public readonly includeInactive: boolean;
  public readonly orderBy: string;
  public readonly orderDirection: 'asc' | 'desc';

  constructor(data: unknown) {
    const validated = GetUsersDtoSchema.parse(data);

    this.page = validated.page;
    this.limit = validated.limit;
    this.searchTerm = validated.searchTerm;
    this.includeInactive = validated.includeInactive;
    this.orderBy = validated.orderBy;
    this.orderDirection = validated.orderDirection;
  }

  public static getSchema() {
    return GetUsersDtoSchema;
  }

  public static validate(data: unknown): GetUsersDtoType {
    return GetUsersDtoSchema.parse(data);
  }

  public getSkip(): number {
    return (this.page - 1) * this.limit;
  }

  public getTake(): number {
    return this.limit;
  }

  public getOrderByObject(): Record<string, 'asc' | 'desc'> {
    return { [this.orderBy]: this.orderDirection };
  }

  public toJSON(): GetUsersDtoType {
    return {
      page: this.page,
      limit: this.limit,
      searchTerm: this.searchTerm,
      includeInactive: this.includeInactive,
      orderBy: this.orderBy,
      orderDirection: this.orderDirection,
    };
  }
}
