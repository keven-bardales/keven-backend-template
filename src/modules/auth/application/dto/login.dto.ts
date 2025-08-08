import { z } from 'zod';

const LoginDtoSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email is too long')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
  deviceInfo: z.string().max(255, 'Device info is too long').optional(),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginDtoType = z.infer<typeof LoginDtoSchema>;

export class LoginDto {
  public readonly email: string;
  public readonly password: string;
  public readonly deviceInfo?: string;
  public readonly rememberMe: boolean;

  constructor(data: unknown) {
    const validated = LoginDtoSchema.parse(data);

    this.email = validated.email;
    this.password = validated.password;
    this.deviceInfo = validated.deviceInfo;
    this.rememberMe = validated.rememberMe;
  }

  public static getSchema() {
    return LoginDtoSchema;
  }

  public static validate(data: unknown): LoginDtoType {
    return LoginDtoSchema.parse(data);
  }

  public toJSON(): LoginDtoType {
    return {
      email: this.email,
      password: this.password,
      deviceInfo: this.deviceInfo,
      rememberMe: this.rememberMe,
    };
  }
}
