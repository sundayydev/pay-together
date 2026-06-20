import { Settlement, SettlementSession } from "../entities/settlement.entity";

export interface SettlementRepository {
  findById(id: string): Promise<Settlement | null>;
  create(settlement: Omit<Settlement, "id" | "createdAt" | "updatedAt" | "status">): Promise<Settlement>;
  updateStatus(id: string, status: "PENDING" | "COMPLETED" | "FAILED", transactionId?: string): Promise<Settlement>;
  findByGroupId(groupId: string): Promise<Settlement[]>;
  createSession(session: Omit<SettlementSession, "id" | "createdAt" | "updatedAt" | "status">, expenseIds: string[], settlements: Omit<Settlement, "id" | "createdAt" | "updatedAt" | "status">[]): Promise<SettlementSession>;
  getSessionById(id: string): Promise<SettlementSession | null>;
  listSessionsByGroupId(groupId: string): Promise<SettlementSession[]>;
}
