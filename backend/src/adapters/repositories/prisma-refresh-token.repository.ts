import { PrismaClient } from "../../../generated/prisma/client";
import { RefreshToken } from "../../domain/entities/refresh-token.entity";
import { RefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { serializeBigInts } from "../../utils/serialize";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId: BigInt(userId),
        expiresAt,
      },
    });
    return serializeBigInts(refreshToken) as any as RefreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    return serializeBigInts(refreshToken) as any as RefreshToken | null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: BigInt(id) },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId: BigInt(userId), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
