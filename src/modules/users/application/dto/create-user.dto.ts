/* eslint-disable no-useless-escape */
import { z } from 'zod';

const CreateUserDtoSchema = z.object({
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
      /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
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
  isActive: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(true),
});

export type CreateUserDtoType = z.infer<typeof CreateUserDtoSchema>;

export class CreateUserDto {
  public readonly email: string;
  public readonly password: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly isActive: boolean;
  public readonly mustChangePassword: boolean;

  constructor(data: unknown) {
    const validated = CreateUserDtoSchema.parse(data);

    this.email = validated.email;
    this.password = validated.password;
    this.firstName = validated.firstName;
    this.lastName = validated.lastName;
    this.isActive = validated.isActive;
    this.mustChangePassword = validated.mustChangePassword;
  }

  public static getSchema() {
    return CreateUserDtoSchema;
  }

  public static validate(data: unknown): CreateUserDtoType {
    return CreateUserDtoSchema.parse(data);
  }

  public toJSON(): CreateUserDtoType {
    return {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      mustChangePassword: this.mustChangePassword,
    };
  }
}
