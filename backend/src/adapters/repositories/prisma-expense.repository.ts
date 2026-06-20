import { PrismaClient } from "../../../generated/prisma/client";
import { Expense, ExpenseSplit } from "../../domain/entities/expense.entity";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";
import { serializeBigInts } from "../../utils/serialize";

export class PrismaExpenseRepository implements ExpenseRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Expense | null> {
    const expense = await this.prisma.expense.findUnique({
      where: { id: BigInt(id), deletedAt: null },
      include: {
        splits: { where: { deletedAt: null }, include: { user: true } },
        paidBy: true,
      },
    });
    return serializeBigInts(expense) as any as Expense | null;
  }

  async create(
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt" | "status">,
    splits: Omit<ExpenseSplit, "id" | "expenseId" | "createdAt">[]
  ): Promise<Expense> {
    const newExpense = await this.prisma.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          groupId: BigInt(expense.groupId),
          paidById: BigInt(expense.paidById),
          amount: expense.amount,
          description: expense.description,
          expenseDate: expense.expenseDate,
          createdById: BigInt(expense.createdById),
        },
      });

      await tx.expenseSplit.createMany({
        data: splits.map((s) => ({
          expenseId: createdExpense.id,
          userId: BigInt(s.userId),
          amount: s.amount,
        })),
      });

      return tx.expense.findUnique({
        where: { id: createdExpense.id },
        include: {
          splits: { where: { deletedAt: null }, include: { user: true } },
          paidBy: true,
        },
      });
    });

    if (!newExpense) {
      throw new Error("Failed to create expense");
    }

    return serializeBigInts(newExpense) as any as Expense;
  }

  async findByGroupId(groupId: string): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({
      where: { groupId: BigInt(groupId), deletedAt: null },
      include: {
        splits: { where: { deletedAt: null }, include: { user: true } },
        paidBy: true,
      },
      orderBy: { expenseDate: "desc" },
    });
    return serializeBigInts(expenses) as any as Expense[];
  }

  async updateStatus(id: string, status: "PENDING" | "SETTLED"): Promise<Expense> {
    const expense = await this.prisma.expense.update({
      where: { id: BigInt(id) },
      data: { status },
      include: {
        splits: { where: { deletedAt: null }, include: { user: true } },
        paidBy: true,
      },
    });
    return serializeBigInts(expense) as any as Expense;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id: BigInt(id) },
        data: { deletedAt: new Date() },
      });
      await tx.expenseSplit.updateMany({
        where: { expenseId: BigInt(id) },
        data: { deletedAt: new Date() },
      });
    });
  }
}
