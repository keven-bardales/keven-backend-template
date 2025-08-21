import { z } from 'zod';

const CreateModuleDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Module name is required')
    .max(50, 'Module name cannot exceed 50 characters')
    .trim(),
  description: z.string().max(255, 'Description cannot exceed 255 characters').optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateModuleDtoType = z.infer<typeof CreateModuleDtoSchema>;

export class CreateModuleDto {
  public readonly name: string;
  public readonly description?: string;
  public readonly isActive: boolean;

  constructor(data: unknown) {
    const validated = CreateModuleDtoSchema.parse(data);

    this.name = validated.name;
    this.description = validated.description;
    this.isActive = validated.isActive;
  }

  public static getSchema() {
    return CreateModuleDtoSchema;
  }

  public static validate(data: unknown): CreateModuleDtoType {
    return CreateModuleDtoSchema.parse(data);
  }

  public toJSON(): CreateModuleDtoType {
    return {
      name: this.name,
      description: this.description,
      isActive: this.isActive,
    };
  }
}
