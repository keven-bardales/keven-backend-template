import { z } from 'zod';

const RegisterDtoSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email is too long')
    .toLowerCase()
    .trim(),
  password: z
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
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name cannot be longer than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot be longer than 50 characters')
    .trim(),
  acceptTerms: z.boolean().optional().default(false),
  marketingEmails: z.boolean().optional().default(false),
});

export type RegisterDtoType = z.infer<typeof RegisterDtoSchema>;

export class RegisterDto {
  public readonly email: string;
  public readonly password: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly acceptTerms: boolean;
  public readonly marketingEmails: boolean;

  constructor(data: unknown) {
    const validated = RegisterDtoSchema.parse(data);

    this.email = validated.email;
    this.password = validated.password;
    this.firstName = validated.firstName;
    this.lastName = validated.lastName;
    this.acceptTerms = validated.acceptTerms;
    this.marketingEmails = validated.marketingEmails;
  }

  public static getSchema() {
    return RegisterDtoSchema;
  }

  public static validate(data: unknown): RegisterDtoType {
    return RegisterDtoSchema.parse(data);
  }

  public toJSON(): RegisterDtoType {
    return {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      acceptTerms: this.acceptTerms,
      marketingEmails: this.marketingEmails,
    };
  }
}
