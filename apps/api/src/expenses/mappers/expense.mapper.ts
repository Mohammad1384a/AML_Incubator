import type { Expense } from "../../generated/prisma/client";

import { ExpenseResponseDto } from "../dto/expense-response.dto";

export function toExpenseResponseDto(expense: Expense): ExpenseResponseDto {
  return {
    id: expense.id,
    amount: Number(expense.amount),
    category: expense.category,
    description: expense.description,
    spentAt: expense.spentAt,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}
