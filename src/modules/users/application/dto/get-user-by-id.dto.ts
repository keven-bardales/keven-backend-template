import { z } from 'zod';

const GetUserByIdDtoSchema = z.object({
  id: z.string().uuid('Invalid user ID format').min(1, 'User ID is required'),
});

export type GetUserByIdDtoType = z.infer<typeof GetUserByIdDtoSchema>;

export class GetUserByIdDto {
  public readonly id: string;

  constructor(data: unknown) {
    const validated = GetUserByIdDtoSchema.parse(data);
    this.id = validated.id;
  }

  public static getSchema() {
    return GetUserByIdDtoSchema;
  }

  public static validate(data: unknown): GetUserByIdDtoType {
    return GetUserByIdDtoSchema.parse(data);
  }

  public toJSON(): GetUserByIdDtoType {
    return {
      id: this.id,
    };
  }
}
