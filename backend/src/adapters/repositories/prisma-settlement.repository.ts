import { PrismaClient } from "../../../generated/prisma/client";
import {
  Settlement,
  SettlementSession,
} from "../../domain/entities/settlement.entity";
import { SettlementRepository } from "../../domain/repositories/settlement.repository";

export class PrismaSettlementRepository implements SettlementRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Settlement | null> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id, deletedAt: null },
      include: { payer: true, receiver: true },
    });
    return settlement as any as Settlement | null;
  }

  async create(
    data: Omit<Settlement, "id" | "createdAt" | "updatedAt" | "status">,
  ): Promise<Settlement> {
    const settlement = await this.prisma.settlement.create({
      data: {
        groupId: data.groupId,
        payerId: data.payerId,
        receiverId: data.receiverId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentGatewayTransactionId: data.paymentGatewayTransactionId,
        paymentLink: data.paymentLink,
        description: data.description,
        settlementSessionId: data.settlementSessionId,
      },
      include: { payer: true, receiver: true },
    });
    return settlement as any as Settlement;
  }

  async updateStatus(
    id: string,
    status: "PENDING" | "COMPLETED" | "FAILED",
    transactionId?: string,
  ): Promise<Settlement> {
    const settlement = await this.prisma.settlement.update({
      where: { id },
      data: {
        status,
        ...(transactionId
          ? { paymentGatewayTransactionId: transactionId }
          : {}),
      },
      include: { payer: true, receiver: true },
    });
    return settlement as any as Settlement;
  }

  async findByGroupId(groupId: string): Promise<Settlement[]> {
    const settlements = await this.prisma.settlement.findMany({
      where: { groupId, deletedAt: null },
      include: { payer: true, receiver: true },
      orderBy: { createdAt: "desc" },
    });
    return settlements as any as Settlement[];
  }

  async createSession(
    session: Omit<
      SettlementSession,
      "id" | "createdAt" | "updatedAt" | "status"
    >,
    expenseIds: string[],
    settlements: Omit<
      Settlement,
      "id" | "createdAt" | "updatedAt" | "status"
    >[],
  ): Promise<SettlementSession> {
    const newSession = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.settlementSession.create({
        data: {
          groupId: session.groupId,
          startDate: session.startDate,
          endDate: session.endDate,
          createdById: session.createdById,
        },
      });

      await tx.expense.updateMany({
        where: { id: { in: expenseIds } },
        data: { settlementSessionId: createdSession.id, status: "SETTLED" },
      });

      for (const set of settlements) {
        await tx.settlement.create({
          data: {
            groupId: set.groupId,
            payerId: set.payerId,
            receiverId: set.receiverId,
            amount: set.amount,
            paymentMethod: set.paymentMethod,
            description: set.description,
            settlementSessionId: createdSession.id,
          },
        });
      }

      return tx.settlementSession.findUnique({
        where: { id: createdSession.id },
        include: {
          expenses: true,
          settlements: { include: { payer: true, receiver: true } },
        },
      });
    });

    if (!newSession) {
      throw new Error("Failed to create settlement session");
    }

    return newSession as any as SettlementSession;
  }

  async getSessionById(id: string): Promise<SettlementSession | null> {
    const session = await this.prisma.settlementSession.findUnique({
      where: { id, deletedAt: null },
      include: {
        expenses: { include: { paidBy: true } },
        settlements: { include: { payer: true, receiver: true } },
      },
    });
    return session as any as SettlementSession | null;
  }

  async listSessionsByGroupId(groupId: string): Promise<SettlementSession[]> {
    const sessions = await this.prisma.settlementSession.findMany({
      where: { groupId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return sessions as any as SettlementSession[];
  }
}
