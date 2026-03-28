import type { INestApplication } from "@nestjs/common";
import request from "supertest";

export type AuthCredentials = {
  email: string;
  password: string;
};

export function createAuthCredentials(
  overrides: Partial<AuthCredentials> = {},
): AuthCredentials {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;

  return {
    email: `user-${uniqueSuffix}@example.com`,
    password: "StrongPass123!",
    ...overrides,
  };
}

export async function registerUser(
  app: INestApplication,
  credentials: AuthCredentials,
) {
  return request(app.getHttpServer())
    .post("/api/auth/register")
    .send(credentials);
}

export async function loginUser(
  app: INestApplication,
  credentials: AuthCredentials,
) {
  return request(app.getHttpServer()).post("/api/auth/login").send(credentials);
}
