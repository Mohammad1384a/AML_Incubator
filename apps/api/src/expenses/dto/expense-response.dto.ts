import type { ExpenseCategory } from "../../generated/prisma/client";

export class ExpenseResponseDto {
  id!: string;
  amount!: number;
  category!: ExpenseCategory;
  description!: string;
  spentAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
