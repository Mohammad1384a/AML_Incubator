import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createTestApp } from "./helpers/test-app";
import {
  createAuthCredentials,
  loginUser,
  registerUser,
} from "./helpers/auth-helper";

function getSetCookieHeader(
  headers: Record<string, string | string[] | undefined>,
): string {
  const value = headers["set-cookie"];

  if (!value) {
    throw new Error("Expected set-cookie header to be present.");
  }

  return Array.isArray(value) ? value.join(";") : value;
}

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/auth/register should create a user", async () => {
    const credentials = createAuthCredentials();

    const response = await registerUser(app, credentials);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        email: credentials.email,
      }),
    );
    expect(response.body).toHaveProperty("id");
    expect(response.body).not.toHaveProperty("password");
  });

  it("POST /api/auth/register should reject duplicate email", async () => {
    const credentials = createAuthCredentials();

    await registerUser(app, credentials);

    const duplicateResponse = await registerUser(app, credentials);

    expect(duplicateResponse.status).toBe(409);
  });

  it("POST /api/auth/login should authenticate and set auth cookie", async () => {
    const credentials = createAuthCredentials();

    await registerUser(app, credentials);

    const response = await loginUser(app, credentials);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        email: credentials.email,
      }),
    );
    expect(response.body).toHaveProperty("id");
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(getSetCookieHeader(response.headers)).toContain("access_token=");
  });

  it("GET /api/auth/me should return 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer()).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  it("GET /api/auth/me should return the current user when authenticated", async () => {
    const credentials = createAuthCredentials();
    const agent = request.agent(app.getHttpServer());

    await agent.post("/api/auth/register").send(credentials);
    await agent.post("/api/auth/login").send(credentials).expect(200);

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual(
      expect.objectContaining({
        email: credentials.email,
      }),
    );
    expect(meResponse.body).toHaveProperty("id");
    expect(meResponse.body).not.toHaveProperty("password");
  });

  it("POST /api/auth/logout should clear auth cookie and invalidate the session", async () => {
    const credentials = createAuthCredentials();
    const agent = request.agent(app.getHttpServer());

    await agent.post("/api/auth/register").send(credentials);
    await agent.post("/api/auth/login").send(credentials).expect(200);

    const logoutResponse = await agent.post("/api/auth/logout");

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers["set-cookie"]).toBeDefined();
    expect(getSetCookieHeader(logoutResponse.headers)).toContain(
      "access_token=",
    );

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(401);
  });
});
