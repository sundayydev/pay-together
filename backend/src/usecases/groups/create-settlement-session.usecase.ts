import { SettlementSession, Settlement } from "../../domain/entities/settlement.entity";
import { GroupRepository } from "../../domain/repositories/group.repository";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";
import { SettlementRepository } from "../../domain/repositories/settlement.repository";

export class CreateSettlementSessionUseCase {
  constructor(
    private groupRepository: GroupRepository,
    private expenseRepository: ExpenseRepository,
    private settlementRepository: SettlementRepository
  ) {}

  async execute(input: {
    groupId: string;
    createdById: string;
    startDate: string | Date;
    endDate: string | Date;
  }): Promise<SettlementSession> {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Khoảng ngày quyết toán không hợp lệ.");
    }
    if (start > end) {
      throw new Error("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
    }

    // 1. Lấy danh sách thành viên nhóm
    const members = await this.groupRepository.getMembers(input.groupId);

    // 2. Lấy tất cả chi tiêu của nhóm
    const expenses = await this.expenseRepository.findByGroupId(input.groupId);

    // 3. Lọc lấy các khoản chi chưa quyết toán (PENDING) nằm trong khoảng ngày
    const selectedExpenses = expenses.filter((e) => {
      const isPending = e.status === "PENDING";
      const expDate = new Date(e.expenseDate);
      const inRange = expDate >= start && expDate <= end;
      return isPending && inRange;
    });

    if (selectedExpenses.length === 0) {
      throw new Error("Không tìm thấy khoản chi tiêu chưa quyết toán nào trong khoảng thời gian này.");
    }

    // 4. Khởi tạo số dư của từng thành viên = 0
    const balancesMap: Record<string, { userId: string; name: string; netBalance: number }> = {};
    for (const m of members) {
      if (m.user) {
        balancesMap[m.userId] = {
          userId: m.userId,
          name: m.user.name,
          netBalance: 0,
        };
      }
    }

    // 5. Tính toán số dư dựa TRÊN các khoản chi được chọn để chốt sổ
    for (const exp of selectedExpenses) {
      const amount = Number(exp.amount);
      const paidById = exp.paidById;

      if (balancesMap[paidById]) {
        balancesMap[paidById].netBalance = Number(
          (balancesMap[paidById].netBalance + amount).toFixed(2)
        );
      }

      for (const split of exp.splits || []) {
        const splitAmount = Number(split.amount);
        const splitUserId = split.userId;

        if (balancesMap[splitUserId]) {
          balancesMap[splitUserId].netBalance = Number(
            (balancesMap[splitUserId].netBalance - splitAmount).toFixed(2)
          );
        }
      }
    }

    const balances = Object.values(balancesMap);

    // 6. Phân tách danh sách Con nợ và Chủ nợ
    const debtors = balances
      .filter((b) => b.netBalance < -0.01)
      .map((b) => ({ ...b }));
    const creditors = balances
      .filter((b) => b.netBalance > 0.01)
      .map((b) => ({ ...b }));

    // Sắp xếp
    debtors.sort((a, b) => a.netBalance - b.netBalance);
    creditors.sort((a, b) => b.netBalance - a.netBalance);

    const pendingSettlements: Omit<Settlement, "id" | "createdAt" | "updatedAt" | "status">[] = [];
    let i = 0;
    let j = 0;

    // 7. Giải thuật Simplify Debts khớp nợ tối giản
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amountToTransfer = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);

      if (amountToTransfer > 0.01) {
        pendingSettlements.push({
          groupId: input.groupId,
          payerId: debtor.userId,
          receiverId: creditor.userId,
          amount: Number(amountToTransfer.toFixed(2)),
          paymentMethod: "BANK_TRANSFER",
          description: `Quyết toán chi tiêu từ ${start.toLocaleDateString("vi-VN")} đến ${end.toLocaleDateString("vi-VN")}`,
          settlementSessionId: "", // Sẽ được cập nhật tự động trong repo transaction
        });
      }

      debtor.netBalance = Number((debtor.netBalance + amountToTransfer).toFixed(2));
      creditor.netBalance = Number((creditor.netBalance - amountToTransfer).toFixed(2));

      if (Math.abs(debtor.netBalance) < 0.01) {
        i++;
      }
      if (Math.abs(creditor.netBalance) < 0.01) {
        j++;
      }
    }

    // 8. Tạo SettlementSession giao dịch qua repo
    const expenseIds = selectedExpenses.map((e) => e.id);

    return this.settlementRepository.createSession(
      {
        groupId: input.groupId,
        startDate: start,
        endDate: end,
        createdById: input.createdById,
      },
      expenseIds,
      pendingSettlements as any
    );
  }
}
