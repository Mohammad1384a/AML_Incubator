"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { authApi } from "../../lib/api/auth";
import {
  loginFormSchema,
  type LoginFormValues,
} from "../../lib/validations/login-form.schema";

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    try {
      setFormError("");
      await authApi.login(values);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to log in.",
      );
    }
  }

  return (
    <section className="auth-card">
      <div className="stack stack-sm">
        <h1>Login</h1>
        <p className="muted">Sign in to access your expense dashboard.</p>
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
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="muted">
        No account yet? <Link href="/register">Create one</Link>
      </p>
    </section>
  );
}
