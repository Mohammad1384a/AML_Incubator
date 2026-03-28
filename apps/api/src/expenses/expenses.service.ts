import { Injectable, NotFoundException } from "@nestjs/common";
import type { Expense } from "../generated/prisma/client";

import { PrismaService } from "../database/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ExpenseResponseDto } from "./dto/expense-response.dto";
import { ExpenseSummaryDto } from "./dto/expense-summary.dto";
import { FilterExpensesQueryDto } from "./dto/filter-expenses-query.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { toExpenseResponseDto } from "./mappers/expense.mapper";

@Injectable()
export class ExpensesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    userId: string,
    createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.prismaService.expense.create({
      data: {
        userId,
        amount: createExpenseDto.amount,
        category: createExpenseDto.category,
        description: createExpenseDto.description,
        spentAt: new Date(createExpenseDto.spentAt),
      },
    });

    return toExpenseResponseDto(expense);
  }

  async findAll(
    userId: string,
    filterDto: FilterExpensesQueryDto,
  ): Promise<ExpenseResponseDto[]> {
    const expenses = await this.prismaService.expense.findMany({
      where: this.buildWhere(userId, filterDto),
      orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
    });

    return expenses.map(toExpenseResponseDto);
  }

  async findOne(
    userId: string,
    expenseId: string,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.findOwnedExpenseOrThrow(userId, expenseId);

    return toExpenseResponseDto(expense);
  }

  async update(
    userId: string,
    expenseId: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    await this.findOwnedExpenseOrThrow(userId, expenseId);

    const expense = await this.prismaService.expense.update({
      where: { id: expenseId },
      data: {
        ...(updateExpenseDto.amount !== undefined
          ? { amount: updateExpenseDto.amount }
          : {}),
        ...(updateExpenseDto.category !== undefined
          ? { category: updateExpenseDto.category }
          : {}),
        ...(updateExpenseDto.description !== undefined
          ? { description: updateExpenseDto.description }
          : {}),
        ...(updateExpenseDto.spentAt !== undefined
          ? { spentAt: new Date(updateExpenseDto.spentAt) }
          : {}),
      },
    });

    return toExpenseResponseDto(expense);
  }

  async remove(userId: string, expenseId: string): Promise<{ success: true }> {
    await this.findOwnedExpenseOrThrow(userId, expenseId);

    await this.prismaService.expense.delete({
      where: { id: expenseId },
    });

    return { success: true };
  }

  async getSummary(
    userId: string,
    filterDto: FilterExpensesQueryDto,
  ): Promise<ExpenseSummaryDto> {
    const result = await this.prismaService.expense.aggregate({
      where: this.buildWhere(userId, filterDto),
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    return {
      totalAmount: Number(result._sum.amount ?? 0),
      count: result._count._all,
    };
  }

  private async findOwnedExpenseOrThrow(
    userId: string,
    expenseId: string,
  ): Promise<Expense> {
    const expense = await this.prismaService.expense.findFirst({
      where: {
        id: expenseId,
        userId,
      },
    });

    if (!expense) {
      throw new NotFoundException("Expense not found.");
    }

    return expense;
  }

  private buildWhere(userId: string, filterDto: FilterExpensesQueryDto) {
    return {
      userId,
      ...(filterDto.category ? { category: filterDto.category } : {}),
      ...(filterDto.from || filterDto.to
        ? {
            spentAt: {
              ...(filterDto.from ? { gte: new Date(filterDto.from) } : {}),
              ...(filterDto.to ? { lte: new Date(filterDto.to) } : {}),
            },
          }
        : {}),
    };
  }
}
