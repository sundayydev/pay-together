import { RefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { generateRandomString } from "../../utils/crypto";
import { sign } from "hono/jwt";
import { TokenResponse } from "./token-password.usecase";

export class TokenRefreshUseCase {
  constructor(private refreshTokenRepository: RefreshTokenRepository) {}

  async execute(input: {
    refreshToken: string;
    jwtSecret: string;
  }): Promise<TokenResponse> {
    const tokenRecord = await this.refreshTokenRepository.findByToken(input.refreshToken);
    if (!tokenRecord) {
      throw new Error("invalid_grant: Invalid refresh token");
    }

    if (tokenRecord.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(tokenRecord.userId);
      throw new Error("invalid_grant: Refresh token has been revoked");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new Error("invalid_grant: Refresh token has expired");
    }

    await this.refreshTokenRepository.revoke(tokenRecord.id);

    const expiresSeconds = 3600;
    const payload = {
      sub: tokenRecord.userId,
      exp: Math.floor(Date.now() / 1000) + expiresSeconds,
    };
    const access_token = await sign(payload, input.jwtSecret, "HS256");

    const newRefreshTokenValue = generateRandomString();
    const newRefreshExpiresAt = new Date();
    newRefreshExpiresAt.setDate(newRefreshExpiresAt.getDate() + 30);

    await this.refreshTokenRepository.create(
      tokenRecord.userId,
      newRefreshTokenValue,
      newRefreshExpiresAt
    );

    return {
      access_token,
      token_type: "Bearer",
      expires_in: expiresSeconds,
      refresh_token: newRefreshTokenValue,
    };
  }
}
