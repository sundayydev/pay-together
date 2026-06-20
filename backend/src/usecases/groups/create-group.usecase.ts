import { Group } from "../../domain/entities/group.entity";
import { GroupRepository } from "../../domain/repositories/group.repository";

export class CreateGroupUseCase {
  constructor(private groupRepository: GroupRepository) {}

  async execute(input: {
    name: string;
    description?: string | null;
    creatorId: string;
  }): Promise<Group> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const group = await this.groupRepository.create({
      name: input.name,
      description: input.description || null,
      inviteCode,
      createdById: input.creatorId,
      deletedAt: null,
    });

    await this.groupRepository.addMember(group.id, input.creatorId, "ADMIN");

    return group;
  }
}
