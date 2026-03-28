import { Type } from "class-transformer";
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

import { ExpenseCategory } from "../../generated/prisma/client";

export class UpdateExpenseDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  spentAt?: string;
}
