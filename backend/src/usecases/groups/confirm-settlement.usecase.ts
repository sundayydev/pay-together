import { Settlement } from "../../domain/entities/settlement.entity";
import { SettlementRepository } from "../../domain/repositories/settlement.repository";

export class ConfirmSettlementUseCase {
  constructor(private settlementRepository: SettlementRepository) {}

  async execute(input: {
    settlementId: string;
    userId: string; // ID của người nhận tiền (để xác thực quyền bảo mật)
  }): Promise<Settlement> {
    const settlement = await this.settlementRepository.findById(input.settlementId);
    if (!settlement) {
      throw new Error("Không tìm thấy giao dịch quyết toán này.");
    }

    if (settlement.receiverId !== input.userId) {
      throw new Error("Chỉ có người nhận tiền mới có quyền xác nhận đã thanh toán.");
    }

    if (settlement.status === "COMPLETED") {
      throw new Error("Giao dịch này đã được xác nhận hoàn thành trước đó.");
    }

    // 1. Cập nhật trạng thái Settlement thành COMPLETED
    const updatedSettlement = await this.settlementRepository.updateStatus(
      input.settlementId,
      "COMPLETED"
    );

    // 2. Nếu settlement thuộc về một SettlementSession, kiểm tra xem tất cả đã hoàn thành chưa
    if (settlement.settlementSessionId) {
      const session = await this.settlementRepository.getSessionById(
        settlement.settlementSessionId
      );

      if (session && session.settlements) {
        const allCompleted = session.settlements.every((s) => {
          if (s.id === input.settlementId) return true; // Giao dịch hiện tại đang được cập nhật
          return s.status === "COMPLETED";
        });

        if (allCompleted) {
          await this.settlementRepository.updateSessionStatus(
            settlement.settlementSessionId,
            "COMPLETED"
          );
        }
      }
    }

    return updatedSettlement;
  }
}
