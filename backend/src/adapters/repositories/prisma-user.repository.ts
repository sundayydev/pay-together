import { PrismaClient } from "../../../generated/prisma/client";
import { User } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";
import { serializeBigInts } from "../../utils/serialize";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id), deletedAt: null },
    });
    return serializeBigInts(user) as any as User | null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber, deletedAt: null },
    });
    return serializeBigInts(user) as any as User | null;
  }

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        passwordHash: data.passwordHash,
        name: data.name,
        avatarUrl: data.avatarUrl,
        momoPhone: data.momoPhone,
        bankCode: data.bankCode,
        bankAccount: data.bankAccount,
        bankAccountName: data.bankAccountName,
      },
    });
    return serializeBigInts(user) as any as User;
  }

  async update(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: data as any,
    });
    return serializeBigInts(user) as any as User;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    });
  }
}
