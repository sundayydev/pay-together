import { PrismaClient } from "../../../generated/prisma/client";
import { Group, GroupMember } from "../../domain/entities/group.entity";
import { GroupRepository } from "../../domain/repositories/group.repository";
import { serializeBigInts } from "../../utils/serialize";

export class PrismaGroupRepository implements GroupRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Group | null> {
    const group = await this.prisma.group.findUnique({
      where: { id: BigInt(id), deletedAt: null },
      include: {
        members: {
          where: { deletedAt: null },
          include: { user: true },
        },
      },
    });
    return serializeBigInts(group) as any as Group | null;
  }

  async findByInviteCode(inviteCode: string): Promise<Group | null> {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode, deletedAt: null },
    });
    return serializeBigInts(group) as any as Group | null;
  }

  async create(data: Omit<Group, "id" | "createdAt" | "updatedAt" | "inviteActive">): Promise<Group> {
    const group = await this.prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        inviteCode: data.inviteCode,
        createdById: BigInt(data.createdById),
      },
    });
    return serializeBigInts(group) as any as Group;
  }

  async listUserGroups(userId: string): Promise<Group[]> {
    const groups = await this.prisma.group.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId: BigInt(userId),
            deletedAt: null,
          },
        },
      },
    });
    return serializeBigInts(groups) as any as Group[];
  }

  async addMember(groupId: string, userId: string, role: "ADMIN" | "MEMBER"): Promise<GroupMember> {
    const member = await this.prisma.groupMember.upsert({
      where: {
        groupId_userId: { groupId: BigInt(groupId), userId: BigInt(userId) },
      },
      update: {
        deletedAt: null,
        role,
      },
      create: {
        groupId: BigInt(groupId),
        userId: BigInt(userId),
        role,
      },
      include: { user: true },
    });
    return serializeBigInts(member) as any as GroupMember;
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId: BigInt(groupId), userId: BigInt(userId) } },
      data: { deletedAt: new Date() },
    });
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId: BigInt(groupId), deletedAt: null },
      include: { user: true },
    });
    return serializeBigInts(members) as any as GroupMember[];
  }
}
