import { UserRepository } from "../../domain/repositories/user.repository";
import { RefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { verifyPassword, generateRandomString } from "../../utils/crypto";
import { sign } from "hono/jwt";

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
}

export class TokenPasswordUseCase {
  constructor(
    private userRepository: UserRepository,
    private refreshTokenRepository: RefreshTokenRepository
  ) {}

  async execute(input: {
    username: string; // phoneNumber
    password: string;
    jwtSecret: string;
  }): Promise<TokenResponse> {
    const user = await this.userRepository.findByPhoneNumber(input.username);
    if (!user) {
      throw new Error("invalid_grant: Invalid username or password");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("invalid_grant: Invalid username or password");
    }

    const expiresSeconds = 3600;
    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + expiresSeconds,
    };
    const access_token = await sign(payload, input.jwtSecret, "HS256");

    const refreshTokenValue = generateRandomString();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

    await this.refreshTokenRepository.create(
      user.id,
      refreshTokenValue,
      refreshExpiresAt
    );

    return {
      access_token,
      token_type: "Bearer",
      expires_in: expiresSeconds,
      refresh_token: refreshTokenValue,
    };
  }
}
