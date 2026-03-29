"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { authApi } from "../../lib/api/auth";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "../../lib/validations/register-form.schema";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });

  async function onSubmit(values: RegisterFormValues): Promise<void> {
    try {
      setFormError("");
      await authApi.register(values);
      await authApi.login(values);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to register.",
      );
    }
  }

  return (
    <section className="auth-card">
      <div className="stack stack-sm">
        <h1>Create account</h1>
        <p className="muted">Register and start tracking your expenses.</p>
      </div>

      <form className="stack" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email ? (
            <small className="field-error">{errors.email.message}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password ? (
            <small className="field-error">{errors.password.message}</small>
          ) : null}
        </label>

        {formError ? <div className="form-error">{formError}</div> : null}

        <button
          className="button primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="muted">
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </section>
  );
}
