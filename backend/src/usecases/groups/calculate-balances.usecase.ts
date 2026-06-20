import { GroupRepository } from "../../domain/repositories/group.repository";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";

export interface DebtTransfer {
  fromUserId: string;
  fromUserName: string;
  fromUserPhone: string;
  toUserId: string;
  toUserName: string;
  toUserPhone: string;
  amount: number;
}

export interface UserBalance {
  userId: string;
  name: string;
  phoneNumber: string;
  netBalance: number;
}

export class CalculateBalancesUseCase {
  constructor(
    private groupRepository: GroupRepository,
    private expenseRepository: ExpenseRepository
  ) {}

  async execute(groupId: string): Promise<{
    balances: UserBalance[];
    debts: DebtTransfer[];
  }> {
    // 1. Lấy danh sách thành viên nhóm
    const members = await this.groupRepository.getMembers(groupId);
    
    // 2. Lấy tất cả chi tiêu của nhóm
    const expenses = await this.expenseRepository.findByGroupId(groupId);
    
    // 3. Lọc chỉ lấy các khoản chi chưa quyết toán (PENDING)
    const pendingExpenses = expenses.filter((e) => e.status === "PENDING");

    // 4. Khởi tạo số dư của từng thành viên = 0
    const balancesMap: Record<string, UserBalance> = {};
    for (const m of members) {
      if (m.user) {
        balancesMap[m.userId] = {
          userId: m.userId,
          name: m.user.name,
          phoneNumber: m.user.phoneNumber,
          netBalance: 0,
        };
      }
    }

    // 5. Tính toán số dư
    for (const exp of pendingExpenses) {
      const amount = Number(exp.amount);
      const paidById = exp.paidById;

      // Cộng tiền người trả
      if (balancesMap[paidById]) {
        balancesMap[paidById].netBalance = Number(
          (balancesMap[paidById].netBalance + amount).toFixed(2)
        );
      }

      // Trừ tiền người chia sẻ (splits)
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

    // 6. Phân tách danh sách Con nợ (netBalance < 0) và Chủ nợ (netBalance > 0)
    const debtors = balances
      .filter((b) => b.netBalance < -0.01)
      .map((b) => ({ ...b }));
    const creditors = balances
      .filter((b) => b.netBalance > 0.01)
      .map((b) => ({ ...b }));

    // Sắp xếp: Con nợ tăng dần (nợ nhiều nhất lên đầu), Chủ nợ giảm dần (được nhận nhiều nhất lên đầu)
    debtors.sort((a, b) => a.netBalance - b.netBalance);
    creditors.sort((a, b) => b.netBalance - a.netBalance);

    const debts: DebtTransfer[] = [];
    let i = 0; // Con nợ hiện tại
    let j = 0; // Chủ nợ hiện tại

    // 7. Giải thuật khớp nối Simplify Debts
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // Số tiền tối đa có thể khớp
      const amountToTransfer = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);

      if (amountToTransfer > 0.01) {
        debts.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.name,
          fromUserPhone: debtor.phoneNumber,
          toUserId: creditor.userId,
          toUserName: creditor.name,
          toUserPhone: creditor.phoneNumber,
          amount: Number(amountToTransfer.toFixed(2)),
        });
      }

      // Cập nhật số dư sau khớp nối
      debtor.netBalance = Number((debtor.netBalance + amountToTransfer).toFixed(2));
      creditor.netBalance = Number((creditor.netBalance - amountToTransfer).toFixed(2));

      // Di chuyển con trỏ nếu nợ được giải quyết xong
      if (Math.abs(debtor.netBalance) < 0.01) {
        i++;
      }
      if (Math.abs(creditor.netBalance) < 0.01) {
        j++;
      }
    }

    return {
      balances: balances.map((b) => ({
        ...b,
        netBalance: Number(b.netBalance.toFixed(2)),
      })),
      debts,
    };
  }
}
