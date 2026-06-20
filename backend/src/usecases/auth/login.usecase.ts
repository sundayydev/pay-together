import { sign } from "hono/jwt";
import { RefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { UserRepository } from "../../domain/repositories/user.repository";
import { generateRandomString, verifyPassword } from "../../utils/crypto";

export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(
    input: { phoneNumber: string; password: string },
    jwtSecret: string,
  ): Promise<{
    token: string;
    refresh_token: string;
    user: { id: string; name: string; phoneNumber: string };
  }> {
    const user = await this.userRepository.findByPhoneNumber(input.phoneNumber);
    if (!user) {
      throw new Error("Invalid phone number or password");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid phone number or password");
    }

    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = await sign(payload, jwtSecret, "HS256");

    const refreshTokenValue = generateRandomString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.refreshTokenRepository.create(
      user.id,
      refreshTokenValue,
      expiresAt,
    );

    return {
      token,
      refresh_token: refreshTokenValue,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
      },
    };
  }
}
