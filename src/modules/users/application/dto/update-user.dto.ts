import { z } from 'zod';

const UpdateUserDtoSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .max(254, 'Email is too long')
      .toLowerCase()
      .trim()
      .optional(),
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(50, 'First name cannot be longer than 50 characters')
      .trim()
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(50, 'Last name cannot be longer than 50 characters')
      .trim()
      .optional(),
    isActive: z.boolean().optional(),
    mustChangePassword: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateUserDtoType = z.infer<typeof UpdateUserDtoSchema>;

export class UpdateUserDto {
  public readonly email?: string;
  public readonly firstName?: string;
  public readonly lastName?: string;
  public readonly isActive?: boolean;
  public readonly mustChangePassword?: boolean;

  constructor(data: unknown) {
    const validated = UpdateUserDtoSchema.parse(data);

    this.email = validated.email;
    this.firstName = validated.firstName;
    this.lastName = validated.lastName;
    this.isActive = validated.isActive;
    this.mustChangePassword = validated.mustChangePassword;
  }

  public static getSchema() {
    return UpdateUserDtoSchema;
  }

  public static validate(data: unknown): UpdateUserDtoType {
    return UpdateUserDtoSchema.parse(data);
  }

  public hasChanges(): boolean {
    return (
      this.email !== undefined ||
      this.firstName !== undefined ||
      this.lastName !== undefined ||
      this.isActive !== undefined ||
      this.mustChangePassword !== undefined
    );
  }

  public toJSON(): UpdateUserDtoType {
    const result: UpdateUserDtoType = {};

    if (this.email !== undefined) result.email = this.email;
    if (this.firstName !== undefined) result.firstName = this.firstName;
    if (this.lastName !== undefined) result.lastName = this.lastName;
    if (this.isActive !== undefined) result.isActive = this.isActive;
    if (this.mustChangePassword !== undefined) result.mustChangePassword = this.mustChangePassword;

    return result;
  }
}
