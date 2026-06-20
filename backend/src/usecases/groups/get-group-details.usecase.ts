import { Group } from "../../domain/entities/group.entity";
import { GroupRepository } from "../../domain/repositories/group.repository";

export class GetGroupDetailsUseCase {
  constructor(private groupRepository: GroupRepository) {}

  async execute(groupId: string): Promise<Group | null> {
    return this.groupRepository.findById(groupId);
  }
}
