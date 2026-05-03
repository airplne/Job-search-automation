import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { type AcquisitionMethod } from "@job-search-automation/shared";
import { createAuthMiddleware, deriveDevUserId, requireAdmin } from "./auth/auth.js";
import { loadEnv, type AppEnv } from "./config/env.js";
import { PrismaStore } from "./store/prismaStore.js";
import { InMemoryStore, type AppStore } from "./store/store.js";

const manualImportSchema = z.object({
  provider: z.string().min(1).default("manual"),
  sourceUrl: z.string().url(),
  title: z.string().min(1),
  companyName: z.string().min(1),
  location: z.string().optional(),
});

const consentSchema = z.object({
  consentType: z.string().min(1),
  version: z.string().min(1),
  scope: z.unknown().optional(),
});

export interface CreateAppOptions {
  env?: AppEnv;
  store?: AppStore;
}

function createCorsOptions(env: AppEnv): cors.CorsOptions {
  if (env.isProduction) {
    return { origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) : false };
  }
  return { origin: true };
}

function redactAuditEvent(event: unknown) {
  return event;
}

export async function createApp(options: CreateAppOptions = {}) {
  const env = options.env ?? loadEnv();
  const store = options.store ?? new PrismaStore();
  await store.seedDefaultSourcePolicies();

  const app = express();
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  });
  app.use(cors(createCorsOptions(env)));
  app.use(express.json({ limit: "1mb" }));

  const requireAuth = createAuthMiddleware(env, store);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "job-search-automation-api" });
  });

  app.post("/auth/dev-login", async (req, res, next) => {
    try {
      if (!env.isDevAuthEnabled) {
        res.status(env.isProduction ? 404 : 403).json({ error: "Forbidden", message: "Local development auth is disabled" });
        return;
      }
      const email = z.string().email().parse(req.body.email);
      const userId = deriveDevUserId(email);
      await store.upsertUser({ id: userId, email });
      await store.writeAudit({ actor: "user", userId, action: "dev_login", targetType: "user", targetId: userId });
      res.json({ userId, email, authMode: "local-dev-only" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/consents", requireAuth, async (req, res, next) => {
    try {
      const body = consentSchema.parse(req.body);
      const userId = req.user!.id;
      await store.grantConsent({ userId, consentType: body.consentType, version: body.version, scope: body.scope });
      await store.writeAudit({ actor: "user", userId, action: "consent_granted", targetType: "consent", metadata: { consentType: body.consentType, version: body.version } });
      res.status(201).json({ granted: true, userId, consentType: body.consentType, version: body.version });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/consents/:consentType", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { consentType } = req.params;
      await store.revokeConsent(userId, consentType);
      await store.writeAudit({ actor: "user", userId, action: "consent_revoked", targetType: "consent", metadata: { consentType } });
      res.json({ revoked: true, userId, consentType });
    } catch (error) {
      next(error);
    }
  });

  app.get("/source-policies", requireAuth, async (_req, res, next) => {
    try {
      res.json({ policies: await store.listSourcePolicies() });
    } catch (error) {
      next(error);
    }
  });

  app.post("/jobs/import/link", requireAuth, async (req, res, next) => {
    try {
      const body = manualImportSchema.parse(req.body);
      const userId = req.user!.id;
      const hasRequiredConsent = await store.hasActiveConsent(userId, "PRODUCT_BOUNDARIES");
      await store.checkSourcePolicy({ userId, provider: body.provider, acquisitionMethod: "manual_user_link" as AcquisitionMethod, hasRequiredConsent });
      const result = await store.createManualImport({ userId, provider: body.provider, sourceUrl: body.sourceUrl, title: body.title, companyName: body.companyName, location: body.location });
      await store.writeAudit({ actor: "user", userId, action: "manual_job_imported", targetType: "job_listing", targetId: result.job.id, metadata: { sourceEventId: result.sourceEvent.id, provider: body.provider } });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/privacy/export", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      await store.writeAudit({ actor: "user", userId, action: "data_export_requested", targetType: "privacy_request" });
      res.status(501).json({ status: "not_implemented", message: "Export request is audited; asynchronous export is planned for a later Sprint 1 privacy hardening task." });
    } catch (error) {
      next(error);
    }
  });

  app.post("/privacy/delete", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      await store.writeAudit({ actor: "user", userId, action: "data_deletion_requested", targetType: "privacy_request" });
      res.status(501).json({ status: "not_implemented", message: "Deletion request is audited; full deletion orchestration is planned before launch." });
    } catch (error) {
      next(error);
    }
  });

  app.get("/audit/events", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      if (!env.isDevAuditEnabled) {
        res.status(env.isProduction ? 404 : 403).json({ error: "Forbidden", message: "Global audit listing is disabled" });
        return;
      }
      const limit = Math.min(Number(req.query.limit ?? 50), 100);
      const events = (await store.listAuditEventsForDevAdmin(limit)).map(redactAuditEvent);
      res.json({ events });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = error.name === "SourcePolicyDeniedError" ? 403 : error instanceof z.ZodError ? 400 : 500;
    const body: Record<string, unknown> = { error: error.name, message: status === 500 && env.isProduction ? "Internal server error" : error.message };
    res.status(status).json(body);
  });

  return app;
}

export function createTestApp() {
  const store = new InMemoryStore();
  return { store, appPromise: createApp({ env: loadEnv({ NODE_ENV: "test", ALLOW_DEV_AUTH: "true", ALLOW_DEV_AUDIT: "true", SESSION_SECRET: "test-secret-value" }), store }) };
}
