import { GroupMember } from "../../domain/entities/group.entity";
import { GroupRepository } from "../../domain/repositories/group.repository";

export class GetGroupMembersUseCase {
  constructor(private groupRepository: GroupRepository) {}

  async execute(groupId: string): Promise<GroupMember[]> {
    return this.groupRepository.getMembers(groupId);
  }
}
