import { User } from "./user.entity";

export interface Expense {
  id: string;
  groupId: string;
  paidById: string;
  amount: number;
  description: string;
  expenseDate: Date;
  createdById: string;
  status: "PENDING" | "SETTLED";
  settlementSessionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  paidBy?: User;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  createdAt: Date;
  deletedAt?: Date | null;
  user?: User;
}
