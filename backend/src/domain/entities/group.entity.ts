import { User } from "./user.entity";

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  inviteActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: Date;
  deletedAt?: Date | null;
  user?: User;
}
