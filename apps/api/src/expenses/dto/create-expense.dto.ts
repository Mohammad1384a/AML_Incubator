import { Type } from "class-transformer";
import { IsEnum, IsISO8601, IsNumber, IsString, Min } from "class-validator";

import { ExpenseCategory } from "../../generated/prisma/client";

export class CreateExpenseDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsString()
  description!: string;

  @IsISO8601()
  spentAt!: string;
}
