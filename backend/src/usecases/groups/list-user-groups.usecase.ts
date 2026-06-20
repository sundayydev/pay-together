import { Group } from "../../domain/entities/group.entity";
import { GroupRepository } from "../../domain/repositories/group.repository";

export class ListUserGroupsUseCase {
  constructor(private groupRepository: GroupRepository) {}

  async execute(userId: string): Promise<Group[]> {
    return this.groupRepository.listUserGroups(userId);
  }
}
