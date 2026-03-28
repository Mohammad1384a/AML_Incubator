import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUserDto } from "../auth/dto/auth-user.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ExpenseResponseDto } from "./dto/expense-response.dto";
import { ExpenseSummaryDto } from "./dto/expense-summary.dto";
import { FilterExpensesQueryDto } from "./dto/filter-expenses-query.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesService } from "./expenses.service";

@Controller("expenses")
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @CurrentUser() currentUser: AuthUserDto,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(currentUser.id, createExpenseDto);
  }

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthUserDto,
    @Query() filterDto: FilterExpensesQueryDto,
  ): Promise<ExpenseResponseDto[]> {
    return this.expensesService.findAll(currentUser.id, filterDto);
  }

  @Get("summary")
  getSummary(
    @CurrentUser() currentUser: AuthUserDto,
    @Query() filterDto: FilterExpensesQueryDto,
  ): Promise<ExpenseSummaryDto> {
    return this.expensesService.getSummary(currentUser.id, filterDto);
  }

  @Get(":id")
  findOne(
    @CurrentUser() currentUser: AuthUserDto,
    @Param("id") expenseId: string,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(currentUser.id, expenseId);
  }

  @Patch(":id")
  update(
    @CurrentUser() currentUser: AuthUserDto,
    @Param("id") expenseId: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(
      currentUser.id,
      expenseId,
      updateExpenseDto,
    );
  }

  @Delete(":id")
  remove(
    @CurrentUser() currentUser: AuthUserDto,
    @Param("id") expenseId: string,
  ): Promise<{ success: true }> {
    return this.expensesService.remove(currentUser.id, expenseId);
  }
}
