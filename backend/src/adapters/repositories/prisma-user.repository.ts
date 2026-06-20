import { PrismaClient } from "../../../generated/prisma/client";
import { User } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    return user as User | null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber, deletedAt: null },
    });
    return user as User | null;
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
    return user as User;
  }

  async update(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: data as any,
    });
    return user as User;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
