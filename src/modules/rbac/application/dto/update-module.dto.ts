import { z } from 'zod';

const UpdateModuleDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Module name is required')
    .max(50, 'Module name cannot exceed 50 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateModuleDtoType = z.infer<typeof UpdateModuleDtoSchema>;

export class UpdateModuleDto {
  public readonly name?: string;
  public readonly description?: string | null;
  public readonly isActive?: boolean;

  constructor(data: unknown) {
    const validated = UpdateModuleDtoSchema.parse(data);

    this.name = validated.name;
    this.description = validated.description;
    this.isActive = validated.isActive;
  }

  public static getSchema() {
    return UpdateModuleDtoSchema;
  }

  public static validate(data: unknown): UpdateModuleDtoType {
    return UpdateModuleDtoSchema.parse(data);
  }

  public toJSON(): UpdateModuleDtoType {
    return {
      name: this.name,
      description: this.description,
      isActive: this.isActive,
    };
  }
}
