"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { type ExpensePayload, expenseCategories } from "../../lib/api/expenses";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "../../lib/validations/expense-form.schema";

type ExpenseFormProps = {
  defaultValues?: Partial<ExpensePayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  onCancel?: () => void;
};

function toDateTimeLocalValue(value?: string): string {
  if (!value) {
    return new Date().toISOString().slice(0, 16);
  }

  return new Date(value).toISOString().slice(0, 16);
}

export function ExpenseForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: defaultValues?.amount ?? 0,
      category: defaultValues?.category ?? "FOOD",
      description: defaultValues?.description ?? "",
      spentAt: toDateTimeLocalValue(defaultValues?.spentAt),
    },
  });

  useEffect(() => {
    reset({
      amount: defaultValues?.amount ?? 0,
      category: defaultValues?.category ?? "FOOD",
      description: defaultValues?.description ?? "",
      spentAt: toDateTimeLocalValue(defaultValues?.spentAt),
    });
  }, [defaultValues, reset]);

  async function submit(values: ExpenseFormValues): Promise<void> {
    await onSubmit({
      amount: values.amount,
      category: values.category,
      description: values.description.trim(),
      spentAt: new Date(values.spentAt).toISOString(),
    });

    if (!defaultValues) {
      reset({
        amount: 0,
        category: "FOOD",
        description: "",
        spentAt: toDateTimeLocalValue(),
      });
    }
  }

  return (
    <form className="stack form-panel" onSubmit={handleSubmit(submit)}>
      <div className="form-grid">
        <label className="field">
          <span>Amount</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount ? (
            <small className="field-error">{errors.amount.message}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Category</span>
          <select {...register("category")}>
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category ? (
            <small className="field-error">{errors.category.message}</small>
          ) : null}
        </label>

        <label className="field field-full">
          <span>Description</span>
          <input type="text" {...register("description")} />
          {errors.description ? (
            <small className="field-error">{errors.description.message}</small>
          ) : null}
        </label>

        <label className="field field-full">
          <span>Spent at</span>
          <input type="datetime-local" {...register("spentAt")} />
          {errors.spentAt ? (
            <small className="field-error">{errors.spentAt.message}</small>
          ) : null}
        </label>
      </div>

      <div className="actions">
        <button
          className="button primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>

        {onCancel ? (
          <button className="button secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
