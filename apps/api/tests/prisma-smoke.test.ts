import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaStore } from "../src/store/prismaStore.js";

const prisma = new PrismaClient();
const store = new PrismaStore(prisma);
const userId = "prisma_smoke_user";

describe("Prisma/Postgres Sprint 1 smoke proof", () => {
  beforeAll(async () => {
    await prisma.jobListing.deleteMany({ where: { userId } });
    await prisma.sourceEvent.deleteMany({ where: { userId } });
    await prisma.consent.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await store.seedDefaultSourcePolicies();
    await store.upsertUser({ id: userId, email: "prisma-smoke@example.local" });
  });

  it("proves seeded policy, consent, source event, and linked job persistence", async () => {
    const policies = await store.listSourcePolicies();
    expect(policies.some((policy) => policy.provider === "manual" && policy.acquisitionMethod === "manual_user_link" && policy.enabled)).toBe(true);

    await store.grantConsent({ userId, consentType: "PRODUCT_BOUNDARIES", version: "2026-05-03" });
    expect(await store.hasActiveConsent(userId, "PRODUCT_BOUNDARIES")).toBe(true);

    await store.checkSourcePolicy({ userId, provider: "manual", acquisitionMethod: "manual_user_link", hasRequiredConsent: true });
    const result = await store.createManualImport({
      userId,
      provider: "manual",
      sourceUrl: "https://example.com/prisma-smoke-job",
      title: "Prisma Smoke Engineer",
      companyName: "Example Co"
    });

    expect(result.sourceEvent.id).toBeTruthy();
    expect(result.job.sourceEventId).toBe(result.sourceEvent.id);

    const persistedJob = await prisma.jobListing.findUnique({ where: { id: result.job.id } });
    expect(persistedJob?.sourceEventId).toBe(result.sourceEvent.id);
  });

  it("proves failed source policy checks do not persist source events or jobs", async () => {
    const beforeEvents = await prisma.sourceEvent.count({ where: { userId } });
    const beforeJobs = await prisma.jobListing.count({ where: { userId } });

    await expect(
      store.checkSourcePolicy({ userId, provider: "unapproved", acquisitionMethod: "manual_user_link", hasRequiredConsent: true })
    ).rejects.toThrow(/No source policy/);

    expect(await prisma.sourceEvent.count({ where: { userId } })).toBe(beforeEvents);
    expect(await prisma.jobListing.count({ where: { userId } })).toBe(beforeJobs);
  });
});
