import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";

export class CreateExpenseUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(input: {
    groupId: string;
    paidById: string;
    amount: number;
    description: string;
    expenseDate?: string | Date;
    createdById: string;
    splits: { userId: string; amount?: number | null }[];
  }): Promise<Expense> {
    const totalAmount = Number(input.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("Số tiền chi tiêu phải lớn hơn 0.");
    }

    if (!input.splits || input.splits.length === 0) {
      throw new Error("Khoản chi phải có ít nhất một thành viên tham gia phân bổ.");
    }

    let finalSplits: { userId: string; amount: number }[] = [];
    const hasAutoSplit = input.splits.some(s => s.amount === undefined || s.amount === null);

    if (hasAutoSplit) {
      // Tính toán chia đều (Equal Split)
      const count = input.splits.length;
      const equalAmount = Math.floor((totalAmount / count) * 100) / 100; // Làm tròn đến 2 chữ số thập phân
      let sum = 0;

      finalSplits = input.splits.map((s, idx) => {
        const isLast = idx === count - 1;
        // Người cuối cùng sẽ nhận phần còn lại để tránh sai số chia lẻ
        const amt = isLast ? Number((totalAmount - sum).toFixed(2)) : equalAmount;
        sum = Number((sum + amt).toFixed(2));
        return { userId: s.userId, amount: amt };
      });
    } else {
      // Phân bổ tùy chỉnh (Custom Split)
      let sum = 0;
      finalSplits = input.splits.map(s => {
        const amt = Number(s.amount);
        if (isNaN(amt) || amt < 0) {
          throw new Error("Số tiền phân bổ cho thành viên không hợp lệ.");
        }
        sum = Number((sum + amt).toFixed(2));
        return { userId: s.userId, amount: amt };
      });

      if (Math.abs(sum - totalAmount) > 0.01) {
        throw new Error(`Tổng số tiền phân bổ (${sum}) không khớp với tổng tiền chi tiêu (${totalAmount}).`);
      }
    }

    const expenseDate = input.expenseDate ? new Date(input.expenseDate) : new Date();

    return this.expenseRepository.create(
      {
        groupId: input.groupId,
        paidById: input.paidById,
        amount: totalAmount,
        description: input.description,
        expenseDate,
        createdById: input.createdById,
      },
      finalSplits
    );
  }
}
