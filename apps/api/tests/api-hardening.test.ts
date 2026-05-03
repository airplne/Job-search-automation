import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp, createTestApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { InMemoryStore } from "../src/store/store.js";

async function authedApp() {
  const { store, appPromise } = createTestApp();
  const app = await appPromise;
  return { app, store, userId: "dev_user_1", auth: { "x-dev-user-id": "dev_user_1" } };
}

async function grantProductConsent(app: Awaited<ReturnType<typeof authedApp>>["app"], auth: Record<string, string>) {
  return request(app).post("/consents").set(auth).send({ consentType: "PRODUCT_BOUNDARIES", version: "2026-05-03" });
}

describe("auth and protected routes", () => {
  it("disables local dev login in production", async () => {
    const store = new InMemoryStore();
    const app = await createApp({ env: loadEnv({ NODE_ENV: "production", ALLOW_DEV_AUTH: "false", SESSION_SECRET: "production-secret-value" }), store });
    const response = await request(app).post("/auth/dev-login").send({ email: "test@example.com" });
    expect(response.status).toBe(404);
  });

  it("requires ALLOW_DEV_AUTH=true outside production", async () => {
    const store = new InMemoryStore();
    const app = await createApp({ env: loadEnv({ NODE_ENV: "test", ALLOW_DEV_AUTH: "false", SESSION_SECRET: "test-secret-value" }), store });
    const response = await request(app).post("/auth/dev-login").send({ email: "test@example.com" });
    expect(response.status).toBe(403);
  });

  it("rejects protected routes without authenticated context", async () => {
    const { app } = await authedApp();
    const response = await request(app).post("/consents").send({ consentType: "PRODUCT_BOUNDARIES", version: "2026-05-03" });
    expect(response.status).toBe(401);
  });

  it("does not trust body userId for consent grants", async () => {
    const { app, store, auth, userId } = await authedApp();
    const response = await request(app).post("/consents").set(auth).send({ userId: "attacker", consentType: "PRODUCT_BOUNDARIES", version: "2026-05-03" });
    expect(response.status).toBe(201);
    expect(await store.hasActiveConsent(userId, "PRODUCT_BOUNDARIES")).toBe(true);
    expect(await store.hasActiveConsent("attacker", "PRODUCT_BOUNDARIES")).toBe(false);
  });
});

describe("manual import API", () => {
  it("blocks import before product-boundary consent and creates no records", async () => {
    const { app, store, auth, userId } = await authedApp();
    const response = await request(app).post("/jobs/import/link").set(auth).send({
      provider: "manual",
      sourceUrl: "https://example.com/jobs/123",
      title: "Software Engineer",
      companyName: "Example Co"
    });

    expect(response.status).toBe(403);
    expect(await store.countJobsForUser(userId)).toBe(0);
    expect(await store.countSourceEventsForUser(userId)).toBe(0);
    expect(store.audit.some((event) => event.action === "source_blocked")).toBe(true);
  });

  it("creates a source event before a linked job listing after consent", async () => {
    const { app, store, auth, userId } = await authedApp();
    await grantProductConsent(app, auth);

    const response = await request(app).post("/jobs/import/link").set(auth).send({
      userId: "attacker",
      provider: "manual",
      sourceUrl: "https://example.com/jobs/123?utm_source=test",
      title: "Software Engineer",
      companyName: "Example Co",
      location: "Remote"
    });

    expect(response.status).toBe(201);
    expect(response.body.sourceEvent).toMatchObject({ userId, provider: "manual", acquisitionMethod: "manual_user_link" });
    expect(response.body.job).toMatchObject({ userId, sourceEventId: response.body.sourceEvent.id, sourceProvider: "manual" });
    expect(await store.countSourceEventsForUser(userId)).toBe(1);
    expect(await store.countJobsForUser(userId)).toBe(1);
    expect(store.audit.some((event) => event.action === "manual_job_imported")).toBe(true);
  });

  it("revoked consent blocks future imports", async () => {
    const { app, store, auth, userId } = await authedApp();
    await grantProductConsent(app, auth);
    await request(app).delete("/consents/PRODUCT_BOUNDARIES").set(auth);

    const response = await request(app).post("/jobs/import/link").set(auth).send({
      provider: "manual",
      sourceUrl: "https://example.com/jobs/123",
      title: "Software Engineer",
      companyName: "Example Co"
    });

    expect(response.status).toBe(403);
    expect(await store.countJobsForUser(userId)).toBe(0);
    expect(store.audit.some((event) => event.action === "consent_revoked")).toBe(true);
  });

  it("blocks unapproved providers and creates no job", async () => {
    const { app, store, auth, userId } = await authedApp();
    await grantProductConsent(app, auth);

    const response = await request(app).post("/jobs/import/link").set(auth).send({
      provider: "unapproved",
      sourceUrl: "https://unapproved.example/jobs/123",
      title: "Software Engineer",
      companyName: "Example Co"
    });

    expect(response.status).toBe(403);
    expect(await store.countJobsForUser(userId)).toBe(0);
    expect(await store.countSourceEventsForUser(userId)).toBe(0);
  });

  it("rejects invalid URL, title, or company", async () => {
    const { app, auth } = await authedApp();
    const response = await request(app).post("/jobs/import/link").set(auth).send({ provider: "manual", sourceUrl: "not-a-url", title: "", companyName: "" });
    expect(response.status).toBe(400);
  });
});

describe("audit and privacy routes", () => {
  it("does not expose audit events publicly", async () => {
    const { app } = await authedApp();
    const response = await request(app).get("/audit/events");
    expect(response.status).toBe(401);
  });

  it("does not expose global audit events to ordinary users", async () => {
    const { app, auth } = await authedApp();
    const response = await request(app).get("/audit/events").set(auth);
    expect(response.status).toBe(403);
  });

  it("allows dev-admin audit listing only when explicitly enabled", async () => {
    const { app } = await authedApp();
    const response = await request(app).get("/audit/events").set({ "x-dev-user-id": "admin_user", "x-dev-admin": "true" });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.events)).toBe(true);
  });

  it("audits export and delete route stubs", async () => {
    const { app, store, auth } = await authedApp();
    expect((await request(app).post("/privacy/export").set(auth)).status).toBe(501);
    expect((await request(app).post("/privacy/delete").set(auth)).status).toBe(501);
    expect(store.audit.some((event) => event.action === "data_export_requested")).toBe(true);
    expect(store.audit.some((event) => event.action === "data_deletion_requested")).toBe(true);
  });
});
