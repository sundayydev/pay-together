import { Expense, ExpenseSplit } from "../entities/expense.entity";

export interface ExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  create(expense: Omit<Expense, "id" | "createdAt" | "updatedAt" | "status">, splits: Omit<ExpenseSplit, "id" | "expenseId" | "createdAt">[]): Promise<Expense>;
  findByGroupId(groupId: string): Promise<Expense[]>;
  updateStatus(id: string, status: "PENDING" | "SETTLED"): Promise<Expense>;
  delete(id: string): Promise<void>;
}
