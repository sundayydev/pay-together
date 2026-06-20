import { Group, GroupMember } from "../entities/group.entity";

export interface GroupRepository {
  findById(id: string): Promise<Group | null>;
  findByInviteCode(inviteCode: string): Promise<Group | null>;
  create(group: Omit<Group, "id" | "createdAt" | "updatedAt" | "inviteActive">): Promise<Group>;
  listUserGroups(userId: string): Promise<Group[]>;
  addMember(groupId: string, userId: string, role: "ADMIN" | "MEMBER"): Promise<GroupMember>;
  removeMember(groupId: string, userId: string): Promise<void>;
  getMembers(groupId: string): Promise<GroupMember[]>;
}
