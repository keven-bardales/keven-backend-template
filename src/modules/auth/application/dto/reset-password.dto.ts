import { z } from 'zod';

const RequestPasswordResetDtoSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email is too long')
    .toLowerCase()
    .trim(),
});

export type RequestPasswordResetDtoType = z.infer<typeof RequestPasswordResetDtoSchema>;

export class RequestPasswordResetDto {
  public readonly email: string;

  constructor(data: unknown) {
    const validated = RequestPasswordResetDtoSchema.parse(data);
    this.email = validated.email;
  }

  public static getSchema() {
    return RequestPasswordResetDtoSchema;
  }

  public static validate(data: unknown): RequestPasswordResetDtoType {
    return RequestPasswordResetDtoSchema.parse(data);
  }

  public toJSON(): RequestPasswordResetDtoType {
    return {
      email: this.email,
    };
  }
}

const ConfirmPasswordResetDtoSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required').max(500, 'Token is too long'),
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
  });

export type ConfirmPasswordResetDtoType = z.infer<typeof ConfirmPasswordResetDtoSchema>;

export class ConfirmPasswordResetDto {
  public readonly token: string;
  public readonly newPassword: string;
  public readonly confirmPassword: string;

  constructor(data: unknown) {
    const validated = ConfirmPasswordResetDtoSchema.parse(data);

    this.token = validated.token;
    this.newPassword = validated.newPassword;
    this.confirmPassword = validated.confirmPassword;
  }

  public static getSchema() {
    return ConfirmPasswordResetDtoSchema;
  }

  public static validate(data: unknown): ConfirmPasswordResetDtoType {
    return ConfirmPasswordResetDtoSchema.parse(data);
  }

  public toJSON(): ConfirmPasswordResetDtoType {
    return {
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    };
  }
}
