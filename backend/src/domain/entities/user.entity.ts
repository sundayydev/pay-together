export interface User {
  id: string;
  phoneNumber: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string | null;
  momoPhone?: string | null;
  bankCode?: string | null;
  bankAccount?: string | null;
  bankAccountName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
