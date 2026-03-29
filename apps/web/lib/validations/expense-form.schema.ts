import { z } from "zod";

import { expenseCategories } from "../api/expenses";

export const expenseFormSchema = z.object({
  amount: z
    .number({
      error: "Amount is required.",
    })
    .positive("Amount must be greater than zero."),
  category: z.enum(expenseCategories),
  description: z.string().trim().min(1, "Description is required."),
  spentAt: z.string().min(1, "Date and time are required."),
});

export type ExpenseFormValues = z.output<typeof expenseFormSchema>;
