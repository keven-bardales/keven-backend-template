import { z } from 'zod';

const ChangePasswordDtoSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Password is too long'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password is too long')
      .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
      .regex(/(?=.*\d)/, 'Password must contain at least one number')
      .regex(
        /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDtoSchema>;

export class ChangePasswordDto {
  public readonly currentPassword: string;
  public readonly newPassword: string;
  public readonly confirmPassword: string;

  constructor(data: unknown) {
    const validated = ChangePasswordDtoSchema.parse(data);

    this.currentPassword = validated.currentPassword;
    this.newPassword = validated.newPassword;
    this.confirmPassword = validated.confirmPassword;
  }

  public static getSchema() {
    return ChangePasswordDtoSchema;
  }

  public static validate(data: unknown): ChangePasswordDtoType {
    return ChangePasswordDtoSchema.parse(data);
  }

  public toJSON(): ChangePasswordDtoType {
    return {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    };
  }
}
