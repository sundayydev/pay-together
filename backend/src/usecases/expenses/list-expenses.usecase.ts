import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";

export class ListExpensesUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(groupId: string): Promise<Expense[]> {
    return this.expenseRepository.findByGroupId(groupId);
  }
}
