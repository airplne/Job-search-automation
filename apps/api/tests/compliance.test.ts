import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import {
  defaultMvpSourcePolicies,
  evaluateSourcePolicy,
  isProhibitedSourceAction,
} from "@job-search-automation/shared";
import { createApp, resetInMemoryState } from "../src/app.js";

beforeEach(() => resetInMemoryState());

describe("source compliance guardrails", () => {
  it("blocks prohibited source methods even if a provider name varies by case", () => {
    expect(isProhibitedSourceAction("Indeed", "scrape")).toBe(true);
    expect(isProhibitedSourceAction("Glassdoor", "bulk_content_copy")).toBe(true);
    expect(isProhibitedSourceAction("Example", "headless_browser")).toBe(true);
    expect(isProhibitedSourceAction("Example", "platform_automation")).toBe(true);
  });

  it("denies missing source policies by default", () => {
    const decision = evaluateSourcePolicy("unknown", "manual_user_link", defaultMvpSourcePolicies, true);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("No source policy");
  });

  it("requires consent for MVP manual link import", () => {
    const decision = evaluateSourcePolicy("manual", "manual_user_link", defaultMvpSourcePolicies, false);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("consent");
  });

  it("allows manual user link import after consent", () => {
    const decision = evaluateSourcePolicy("manual", "manual_user_link", defaultMvpSourcePolicies, true);
    expect(decision.allowed).toBe(true);
  });
});

describe("manual import API", () => {
  it("blocks import before product-boundary consent", async () => {
    const app = createApp();
    const response = await request(app).post("/jobs/import/link").send({
      userId: "user_1",
      provider: "manual",
      sourceUrl: "https://example.com/jobs/123",
      title: "Software Engineer",
      companyName: "Example Co",
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("consent");
  });

  it("creates a source-attributed job after consent", async () => {
    const app = createApp();
    await request(app).post("/consents").send({
      userId: "user_1",
      consentType: "PRODUCT_BOUNDARIES",
      version: "2026-05-03",
    });

    const response = await request(app).post("/jobs/import/link").send({
      userId: "user_1",
      provider: "manual",
      sourceUrl: "https://example.com/jobs/123?utm_source=test",
      title: "Software Engineer",
      companyName: "Example Co",
      location: "Remote",
    });

    expect(response.status).toBe(201);
    expect(response.body.job).toMatchObject({
      userId: "user_1",
      sourceProvider: "manual",
      sourceAttributionRequired: true,
    });
  });
});
