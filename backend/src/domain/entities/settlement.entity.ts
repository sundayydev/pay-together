import { User } from "./user.entity";

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "MOMO";
  status: "PENDING" | "COMPLETED" | "FAILED";
  paymentGatewayTransactionId?: string | null;
  paymentLink?: string | null;
  description?: string | null;
  settlementSessionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  payer?: User;
  receiver?: User;
}

export interface SettlementSession {
  id: string;
  groupId: string;
  startDate: Date;
  endDate: Date;
  status: "PENDING" | "COMPLETED";
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  expenses?: any[];
  settlements?: Settlement[];
}
