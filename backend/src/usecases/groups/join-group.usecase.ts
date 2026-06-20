import { Group } from "../../domain/entities/group.entity";
import { GroupRepository } from "../../domain/repositories/group.repository";

export class JoinGroupUseCase {
  constructor(private groupRepository: GroupRepository) {}

  async execute(input: { inviteCode: string; userId: string }): Promise<Group> {
    const group = await this.groupRepository.findByInviteCode(input.inviteCode);
    if (!group) {
      throw new Error("Mã mời không chính xác hoặc nhóm không tồn tại.");
    }

    // Thêm thành viên vào nhóm
    await this.groupRepository.addMember(group.id, input.userId, "MEMBER");

    return group;
  }
}
