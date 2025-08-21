import { z } from 'zod';

const GetModulesDtoSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetModulesDtoType = z.infer<typeof GetModulesDtoSchema>;

export class GetModulesDto {
  public readonly page: number;
  public readonly limit: number;
  public readonly search?: string;
  public readonly isActive?: boolean;
  public readonly sortBy: 'name' | 'createdAt' | 'updatedAt';
  public readonly sortOrder: 'asc' | 'desc';

  constructor(data: unknown) {
    const validated = GetModulesDtoSchema.parse(data);

    this.page = validated.page;
    this.limit = validated.limit;
    this.search = validated.search;
    this.isActive = validated.isActive;
    this.sortBy = validated.sortBy;
    this.sortOrder = validated.sortOrder;
  }

  public static getSchema() {
    return GetModulesDtoSchema;
  }

  public static validate(data: unknown): GetModulesDtoType {
    return GetModulesDtoSchema.parse(data);
  }

  public get skip(): number {
    return (this.page - 1) * this.limit;
  }

  public toJSON(): GetModulesDtoType {
    return {
      page: this.page,
      limit: this.limit,
      search: this.search,
      isActive: this.isActive,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };
  }
}
