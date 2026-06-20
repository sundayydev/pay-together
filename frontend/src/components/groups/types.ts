export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  bankCode?: string | null;
  bankAccount?: string | null;
  bankAccountName?: string | null;
}

export interface Bank {
  code: string;
  shortName: string;
  name: string;
  logoUrl?: string;
}


export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user?: User;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  members?: GroupMember[];
}

export interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  user?: {
    id: string;
    name: string;
  };
}

export interface Expense {
  id: string;
  groupId: string;
  paidById: string;
  amount: number;
  description: string;
  expenseDate: string;
  status: "PENDING" | "SETTLED";
  paidBy?: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  splits: ExpenseSplit[];
}

export interface UserBalance {
  userId: string;
  name: string;
  phoneNumber: string;
  netBalance: number;
}

export interface DebtTransfer {
  fromUserId: string;
  fromUserName: string;
  fromUserPhone: string;
  toUserId: string;
  toUserName: string;
  toUserPhone: string;
  amount: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "MOMO";
  status: "PENDING" | "COMPLETED" | "FAILED";
  description: string | null;
  settlementSessionId: string | null;
  payer?: User;
  receiver?: User;
}

export interface SettlementSession {
  id: string;
  groupId: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "COMPLETED";
  createdById: string;
  settlements?: Settlement[];
}
