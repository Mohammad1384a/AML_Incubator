import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createAuthCredentials } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

type ExpenseCategory =
  | "FOOD"
  | "TRANSPORT"
  | "ENTERTAINMENT"
  | "HEALTH"
  | "UTILITIES";

type ExpensePayload = {
  amount: number;
  category: ExpenseCategory;
  description: string;
  spentAt: string;
};

function createExpensePayload(
  overrides: Partial<ExpensePayload> = {},
): ExpensePayload {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;

  return {
    amount: 25,
    category: "FOOD",
    description: `expense-${uniqueSuffix}`,
    spentAt: new Date("2026-03-28T10:00:00.000Z").toISOString(),
    ...overrides,
  };
}

async function createAuthenticatedAgent(
  app: INestApplication,
): Promise<ReturnType<typeof request.agent>> {
  const credentials = createAuthCredentials();
  const agent = request.agent(app.getHttpServer());

  await agent.post("/api/auth/register").send(credentials).expect(201);
  await agent.post("/api/auth/login").send(credentials).expect(200);

  return agent;
}

function createExpense(
  agent: ReturnType<typeof request.agent>,
  payload: ExpensePayload,
) {
  return agent.post("/api/expenses").send(payload);
}

function expectExpenseShape(
  expense: Record<string, unknown>,
  payload: ExpensePayload,
): void {
  expect(expense).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      category: payload.category,
      description: payload.description,
    }),
  );

  expect(Number(expense.amount)).toBe(payload.amount);
  expect(new Date(String(expense.spentAt)).toISOString()).toBe(
    new Date(payload.spentAt).toISOString(),
  );
}

describe("ExpensesController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("authentication", () => {
    it("GET /api/expenses should return 401 when unauthenticated", async () => {
      const response = await request(app.getHttpServer()).get("/api/expenses");

      expect(response.status).toBe(401);
    });

    it("GET /api/expenses/summary should return 401 when unauthenticated", async () => {
      const response = await request(app.getHttpServer()).get(
        "/api/expenses/summary",
      );

      expect(response.status).toBe(401);
    });

    it("POST /api/expenses should return 401 when unauthenticated", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/expenses")
        .send(createExpensePayload());

      expect(response.status).toBe(401);
    });

    it("GET /api/expenses/:id should return 401 when unauthenticated", async () => {
      const response = await request(app.getHttpServer()).get(
        "/api/expenses/some-id",
      );

      expect(response.status).toBe(401);
    });

    it("PATCH /api/expenses/:id should return 401 when unauthenticated", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/expenses/some-id")
        .send(createExpensePayload({ description: "unauthorized-update" }));

      expect(response.status).toBe(401);
    });

    it("DELETE /api/expenses/:id should return 401 when unauthenticated", async () => {
      const response = await request(app.getHttpServer()).delete(
        "/api/expenses/some-id",
      );

      expect(response.status).toBe(401);
    });
  });

  describe("crud", () => {
    it("POST /api/expenses should create an expense for the authenticated user", async () => {
      const agent = await createAuthenticatedAgent(app);
      const payload = createExpensePayload();

      const response = await createExpense(agent, payload);

      expect(response.status).toBe(201);
      expectExpenseShape(response.body, payload);
    });

    it("GET /api/expenses should return only the current user expenses", async () => {
      const firstAgent = await createAuthenticatedAgent(app);
      const secondAgent = await createAuthenticatedAgent(app);

      const firstPayload = createExpensePayload({
        description: "first-user-expense",
        amount: 11,
      });
      const secondPayload = createExpensePayload({
        description: "second-user-expense",
        amount: 22,
        category: "TRANSPORT",
      });

      const firstCreateResponse = await createExpense(firstAgent, firstPayload);
      expect(firstCreateResponse.status).toBe(201);

      const secondCreateResponse = await createExpense(
        secondAgent,
        secondPayload,
      );
      expect(secondCreateResponse.status).toBe(201);

      const listResponse = await firstAgent.get("/api/expenses");

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: firstCreateResponse.body.id,
            description: firstPayload.description,
          }),
        ]),
      );
      expect(listResponse.body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: secondCreateResponse.body.id,
            description: secondPayload.description,
          }),
        ]),
      );
    });

    it("GET /api/expenses/:id should return an owned expense", async () => {
      const agent = await createAuthenticatedAgent(app);
      const payload = createExpensePayload({
        description: "owned-expense",
        amount: 19,
      });

      const createResponse = await createExpense(agent, payload);
      expect(createResponse.status).toBe(201);

      const getResponse = await agent.get(
        `/api/expenses/${createResponse.body.id}`,
      );

      expect(getResponse.status).toBe(200);
      expectExpenseShape(getResponse.body, payload);
      expect(getResponse.body.id).toBe(createResponse.body.id);
    });

    it("PATCH /api/expenses/:id should update an owned expense", async () => {
      const agent = await createAuthenticatedAgent(app);

      const createResponse = await createExpense(
        agent,
        createExpensePayload({
          amount: 18,
          category: "FOOD",
          description: "old-description",
        }),
      );
      expect(createResponse.status).toBe(201);

      const updatePayload: ExpensePayload = {
        amount: 42,
        category: "HEALTH",
        description: "updated-description",
        spentAt: new Date("2026-03-29T09:30:00.000Z").toISOString(),
      };

      const updateResponse = await agent
        .patch(`/api/expenses/${createResponse.body.id}`)
        .send(updatePayload);

      expect(updateResponse.status).toBe(200);
      expectExpenseShape(updateResponse.body, updatePayload);
      expect(updateResponse.body.id).toBe(createResponse.body.id);
    });

    it("DELETE /api/expenses/:id should delete an owned expense", async () => {
      const agent = await createAuthenticatedAgent(app);

      const createResponse = await createExpense(
        agent,
        createExpensePayload({
          description: "expense-to-delete",
          amount: 33,
        }),
      );
      expect(createResponse.status).toBe(201);

      const deleteResponse = await agent.delete(
        `/api/expenses/${createResponse.body.id}`,
      );

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ success: true });

      const listResponse = await agent.get("/api/expenses").expect(200);

      expect(listResponse.body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createResponse.body.id,
          }),
        ]),
      );
    });
  });

  describe("authorization / ownership", () => {
    it("GET /api/expenses/:id should return 404 for another user expense", async () => {
      const ownerAgent = await createAuthenticatedAgent(app);
      const intruderAgent = await createAuthenticatedAgent(app);

      const createResponse = await createExpense(
        ownerAgent,
        createExpensePayload({
          description: "private-expense",
          amount: 50,
        }),
      );
      expect(createResponse.status).toBe(201);

      const intruderResponse = await intruderAgent.get(
        `/api/expenses/${createResponse.body.id}`,
      );

      expect(intruderResponse.status).toBe(404);
    });

    it("PATCH /api/expenses/:id should return 404 for another user expense", async () => {
      const ownerAgent = await createAuthenticatedAgent(app);
      const intruderAgent = await createAuthenticatedAgent(app);

      const createResponse = await createExpense(
        ownerAgent,
        createExpensePayload({
          description: "protected-expense-update",
          amount: 51,
        }),
      );
      expect(createResponse.status).toBe(201);

      const intruderUpdatePayload: ExpensePayload = {
        amount: 99,
        category: "UTILITIES",
        description: "hacked-update",
        spentAt: new Date("2026-03-30T12:00:00.000Z").toISOString(),
      };

      const intruderResponse = await intruderAgent
        .patch(`/api/expenses/${createResponse.body.id}`)
        .send(intruderUpdatePayload);

      expect(intruderResponse.status).toBe(404);
    });

    it("DELETE /api/expenses/:id should return 404 for another user expense", async () => {
      const ownerAgent = await createAuthenticatedAgent(app);
      const intruderAgent = await createAuthenticatedAgent(app);

      const createResponse = await createExpense(
        ownerAgent,
        createExpensePayload({
          description: "protected-expense-delete",
          amount: 52,
        }),
      );
      expect(createResponse.status).toBe(201);

      const intruderDeleteResponse = await intruderAgent.delete(
        `/api/expenses/${createResponse.body.id}`,
      );

      expect(intruderDeleteResponse.status).toBe(404);

      const ownerGetResponse = await ownerAgent.get(
        `/api/expenses/${createResponse.body.id}`,
      );

      expect(ownerGetResponse.status).toBe(200);
      expect(ownerGetResponse.body.id).toBe(createResponse.body.id);
    });

    it("GET /api/expenses should never leak another user expenses", async () => {
      const ownerAgent = await createAuthenticatedAgent(app);
      const intruderAgent = await createAuthenticatedAgent(app);

      const ownerPayload = createExpensePayload({
        description: "owner-only-expense",
        amount: 17,
        category: "FOOD",
      });

      const intruderPayload = createExpensePayload({
        description: "intruder-only-expense",
        amount: 44,
        category: "TRANSPORT",
      });

      const ownerCreateResponse = await createExpense(ownerAgent, ownerPayload);
      expect(ownerCreateResponse.status).toBe(201);

      const intruderCreateResponse = await createExpense(
        intruderAgent,
        intruderPayload,
      );
      expect(intruderCreateResponse.status).toBe(201);

      const ownerListResponse = await ownerAgent
        .get("/api/expenses")
        .expect(200);

      expect(ownerListResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: ownerCreateResponse.body.id,
            description: ownerPayload.description,
          }),
        ]),
      );

      expect(ownerListResponse.body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: intruderCreateResponse.body.id,
            description: intruderPayload.description,
          }),
        ]),
      );
    });

    it("GET /api/expenses/summary should include only the current user totals", async () => {
      const ownerAgent = await createAuthenticatedAgent(app);
      const intruderAgent = await createAuthenticatedAgent(app);

      await createExpense(
        ownerAgent,
        createExpensePayload({
          amount: 10,
          category: "FOOD",
          description: "owner-food-1",
          spentAt: new Date("2026-03-15T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      await createExpense(
        ownerAgent,
        createExpensePayload({
          amount: 20,
          category: "FOOD",
          description: "owner-food-2",
          spentAt: new Date("2026-03-16T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      await createExpense(
        intruderAgent,
        createExpensePayload({
          amount: 999,
          category: "FOOD",
          description: "intruder-food",
          spentAt: new Date("2026-03-17T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      const summaryResponse = await ownerAgent
        .get("/api/expenses/summary")
        .query({
          category: "FOOD",
          from: "2026-03-01T00:00:00.000Z",
          to: "2026-03-31T23:59:59.999Z",
        });

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body).toEqual({
        totalAmount: 30,
        count: 2,
      });
    });
  });

  describe("filtering and summary", () => {
    it("GET /api/expenses should filter by category and date range", async () => {
      const agent = await createAuthenticatedAgent(app);

      await createExpense(
        agent,
        createExpensePayload({
          amount: 10,
          category: "FOOD",
          description: "food-in-range",
          spentAt: new Date("2026-03-10T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      await createExpense(
        agent,
        createExpensePayload({
          amount: 20,
          category: "TRANSPORT",
          description: "transport-in-range",
          spentAt: new Date("2026-03-11T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      await createExpense(
        agent,
        createExpensePayload({
          amount: 30,
          category: "FOOD",
          description: "food-out-of-range",
          spentAt: new Date("2026-02-01T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      const response = await agent.get("/api/expenses").query({
        category: "FOOD",
        from: "2026-03-01T00:00:00.000Z",
        to: "2026-03-31T23:59:59.999Z",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: "FOOD",
            description: "food-in-range",
          }),
        ]),
      );
      expect(response.body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            description: "transport-in-range",
          }),
          expect.objectContaining({
            description: "food-out-of-range",
          }),
        ]),
      );
    });

    it("GET /api/expenses/summary should return the filtered total amount", async () => {
      const agent = await createAuthenticatedAgent(app);

      await createExpense(
        agent,
        createExpensePayload({
          amount: 12,
          category: "FOOD",
          description: "summary-food-1",
          spentAt: new Date("2026-03-15T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      await createExpense(
        agent,
        createExpensePayload({
          amount: 18,
          category: "FOOD",
          description: "summary-food-2",
          spentAt: new Date("2026-03-16T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      await createExpense(
        agent,
        createExpensePayload({
          amount: 99,
          category: "UTILITIES",
          description: "summary-utilities",
          spentAt: new Date("2026-03-17T10:00:00.000Z").toISOString(),
        }),
      ).expect(201);

      const response = await agent.get("/api/expenses/summary").query({
        category: "FOOD",
        from: "2026-03-01T00:00:00.000Z",
        to: "2026-03-31T23:59:59.999Z",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalAmount: 30,
        count: 2,
      });
    });
  });
});
