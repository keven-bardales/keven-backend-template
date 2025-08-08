import { z } from 'zod';

const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').trim(),
  deviceInfo: z.string().max(255, 'Device info is too long').optional(),
});

export type RefreshTokenDtoType = z.infer<typeof RefreshTokenDtoSchema>;

export class RefreshTokenDto {
  public readonly refreshToken: string;
  public readonly deviceInfo?: string;

  constructor(data: unknown) {
    const validated = RefreshTokenDtoSchema.parse(data);

    this.refreshToken = validated.refreshToken;
    this.deviceInfo = validated.deviceInfo;
  }

  public static getSchema() {
    return RefreshTokenDtoSchema;
  }

  public static validate(data: unknown): RefreshTokenDtoType {
    return RefreshTokenDtoSchema.parse(data);
  }

  public toJSON(): RefreshTokenDtoType {
    return {
      refreshToken: this.refreshToken,
      deviceInfo: this.deviceInfo,
    };
  }
}
