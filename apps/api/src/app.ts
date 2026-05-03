import express from "express";
import cors from "cors";
import { z } from "zod";
import { defaultMvpSourcePolicies, type AcquisitionMethod } from "@job-search-automation/shared";
import { requireAllowedSource } from "./compliance/sourcePolicy.js";
import { auditLog } from "./audit/auditLog.js";

const manualImportSchema = z.object({
  userId: z.string().min(1),
  provider: z.string().min(1).default("manual"),
  sourceUrl: z.string().url(),
  title: z.string().min(1),
  companyName: z.string().min(1),
  location: z.string().optional(),
});

const consentSchema = z.object({
  userId: z.string().min(1),
  consentType: z.string().min(1),
  version: z.string().min(1),
});

const inMemoryConsents = new Set<string>();
const inMemoryJobs: unknown[] = [];

function consentKey(userId: string, consentType = "PRODUCT_BOUNDARIES"): string {
  return `${userId}:${consentType}`;
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "job-search-automation-api" });
  });

  app.post("/auth/dev-login", (req, res) => {
    const email = z.string().email().parse(req.body.email);
    const userId = Buffer.from(email).toString("base64url");
    auditLog.write({ actor: "user", userId, action: "dev_login", targetType: "user", targetId: userId });
    res.json({ userId, email, authMode: "dev-only" });
  });

  app.post("/consents", (req, res) => {
    const body = consentSchema.parse(req.body);
    inMemoryConsents.add(consentKey(body.userId, body.consentType));
    auditLog.write({ actor: "user", userId: body.userId, action: "consent_granted", targetType: "consent", metadata: body });
    res.status(201).json({ granted: true, ...body });
  });

  app.delete("/consents/:userId/:consentType", (req, res) => {
    const { userId, consentType } = req.params;
    inMemoryConsents.delete(consentKey(userId, consentType));
    auditLog.write({ actor: "user", userId, action: "consent_revoked", targetType: "consent", metadata: { consentType } });
    res.json({ revoked: true, userId, consentType });
  });

  app.get("/source-policies", (_req, res) => {
    res.json({ policies: defaultMvpSourcePolicies });
  });

  app.post("/jobs/import/link", async (req, res, next) => {
    try {
      const body = manualImportSchema.parse(req.body);
      await requireAllowedSource({
        userId: body.userId,
        provider: body.provider,
        acquisitionMethod: "manual_user_link" as AcquisitionMethod,
        hasRequiredConsent: inMemoryConsents.has(consentKey(body.userId)),
        writeAudit: auditLog.write.bind(auditLog),
      });

      const job = {
        id: `job_${inMemoryJobs.length + 1}`,
        userId: body.userId,
        title: body.title,
        companyName: body.companyName,
        location: body.location ?? null,
        sourceProvider: body.provider,
        sourceUrl: body.sourceUrl,
        sourceAttributionRequired: true,
      };
      inMemoryJobs.push(job);
      auditLog.write({ actor: "user", userId: body.userId, action: "manual_job_imported", targetType: "job_listing", targetId: job.id });
      res.status(201).json({ job });
    } catch (error) {
      next(error);
    }
  });

  app.get("/audit/events", (_req, res) => {
    res.json({ events: auditLog.list() });
  });

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = error.name === "SourcePolicyDeniedError" ? 403 : error instanceof z.ZodError ? 400 : 500;
    res.status(status).json({ error: error.name, message: error.message });
  });

  return app;
}

export function resetInMemoryState() {
  inMemoryConsents.clear();
  inMemoryJobs.length = 0;
  auditLog.clear();
}
