import { Prisma, PrismaClient } from "@prisma/client";
import { defaultMvpSourcePolicies, evaluateSourcePolicy, type AcquisitionMethod, type SourcePolicy } from "@job-search-automation/shared";
import type { AppStore, AuditInput, AuditRecord, ConsentInput, ImportLinkInput, JobListingRecord, SourceEventRecord, UserInput } from "./store.js";

function jsonOrUndefined(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue);
}

function toPolicy(row: {
  provider: string;
  acquisitionMethod: string;
  classification: string;
  enabled: boolean;
  requiresConsent: boolean;
  legalStatus: string;
  allowedData: string[];
  disallowedData: string[];
  retentionNote: string;
}): SourcePolicy {
  return {
    provider: row.provider,
    acquisitionMethod: row.acquisitionMethod as AcquisitionMethod,
    classification: row.classification as SourcePolicy["classification"],
    enabled: row.enabled,
    requiresConsent: row.requiresConsent,
    legalStatus: row.legalStatus,
    allowedData: row.allowedData,
    disallowedData: row.disallowedData,
    retentionNote: row.retentionNote,
  };
}

export class PrismaStore implements AppStore {
  constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

  async upsertUser(input: UserInput): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: input.id },
      update: { email: input.email, name: input.name },
      create: { id: input.id, email: input.email, name: input.name },
    });
  }

  async grantConsent(input: ConsentInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.consent.updateMany({
        where: { userId: input.userId, consentType: input.consentType as never, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.consent.create({
        data: { userId: input.userId, consentType: input.consentType as never, version: input.version, scope: jsonOrUndefined(input.scope) },
      });
    });
  }

  async revokeConsent(userId: string, consentType: string): Promise<void> {
    await this.prisma.consent.updateMany({ where: { userId, consentType: consentType as never, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async hasActiveConsent(userId: string, consentType: string): Promise<boolean> {
    const count = await this.prisma.consent.count({ where: { userId, consentType: consentType as never, revokedAt: null } });
    return count > 0;
  }

  async listSourcePolicies(): Promise<SourcePolicy[]> {
    const rows = await this.prisma.sourcePolicy.findMany({ orderBy: [{ provider: "asc" }, { acquisitionMethod: "asc" }] });
    return rows.map(toPolicy);
  }

  async seedDefaultSourcePolicies(): Promise<void> {
    for (const policy of defaultMvpSourcePolicies) {
      await this.prisma.sourcePolicy.upsert({
        where: { provider_acquisitionMethod: { provider: policy.provider, acquisitionMethod: policy.acquisitionMethod as never } },
        update: {
          classification: policy.classification as never,
          legalStatus: policy.legalStatus,
          allowedData: policy.allowedData,
          disallowedData: policy.disallowedData,
          retentionNote: policy.retentionNote,
          enabled: policy.enabled,
          requiresConsent: policy.requiresConsent,
        },
        create: {
          provider: policy.provider,
          acquisitionMethod: policy.acquisitionMethod as never,
          classification: policy.classification as never,
          legalStatus: policy.legalStatus,
          allowedData: policy.allowedData,
          disallowedData: policy.disallowedData,
          retentionNote: policy.retentionNote,
          enabled: policy.enabled,
          requiresConsent: policy.requiresConsent,
        },
      });
    }
  }

  async checkSourcePolicy(input: { userId: string; provider: string; acquisitionMethod: AcquisitionMethod; hasRequiredConsent: boolean }): Promise<SourcePolicy> {
    const policies = await this.listSourcePolicies();
    const decision = evaluateSourcePolicy(input.provider, input.acquisitionMethod, policies, input.hasRequiredConsent);
    await this.writeAudit({ userId: input.userId, actor: "system", action: "source_policy_checked", targetType: "source_policy", metadata: { provider: input.provider, acquisitionMethod: input.acquisitionMethod, allowed: decision.allowed, reason: decision.reason } });
    if (!decision.allowed || !decision.policy) {
      await this.writeAudit({ userId: input.userId, actor: "system", action: "source_blocked", targetType: "source_policy", metadata: { provider: input.provider, acquisitionMethod: input.acquisitionMethod, reason: decision.reason } });
      const error = new Error(decision.reason);
      error.name = "SourcePolicyDeniedError";
      throw error;
    }
    return decision.policy;
  }

  async createManualImport(input: ImportLinkInput): Promise<{ sourceEvent: SourceEventRecord; job: JobListingRecord }> {
    return this.prisma.$transaction(async (tx) => {
      const policy = await tx.sourcePolicy.findUniqueOrThrow({ where: { provider_acquisitionMethod: { provider: input.provider, acquisitionMethod: "manual_user_link" } } });
      const sourceEvent = await tx.sourceEvent.create({
        data: { userId: input.userId, sourcePolicyId: policy.id, provider: input.provider, acquisitionMethod: "manual_user_link", sourceUrl: input.sourceUrl, metadata: { importMode: "manual_field_entry" } },
      });
      const job = await tx.jobListing.create({
        data: { userId: input.userId, sourceEventId: sourceEvent.id, title: input.title, companyName: input.companyName, location: input.location, sourceProvider: input.provider, sourceUrl: input.sourceUrl },
      });
      return {
        sourceEvent: { id: sourceEvent.id, userId: sourceEvent.userId, sourcePolicyId: sourceEvent.sourcePolicyId, provider: sourceEvent.provider, acquisitionMethod: sourceEvent.acquisitionMethod as AcquisitionMethod, sourceUrl: sourceEvent.sourceUrl ?? undefined },
        job: { id: job.id, userId: job.userId, sourceEventId: job.sourceEventId, title: job.title, companyName: job.companyName, location: job.location, sourceProvider: job.sourceProvider, sourceUrl: job.sourceUrl },
      };
    });
  }

  async writeAudit(event: AuditInput): Promise<void> {
    await this.prisma.auditLog.create({ data: { userId: event.userId, actor: event.actor, action: event.action, targetType: event.targetType, targetId: event.targetId, metadata: jsonOrUndefined(event.metadata) } });
  }

  async listAuditEventsForDevAdmin(limit: number): Promise<AuditRecord[]> {
    const rows = await this.prisma.auditLog.findMany({ take: Math.min(limit, 100), orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ id: row.id, userId: row.userId ?? undefined, actor: row.actor, action: row.action, targetType: row.targetType, targetId: row.targetId ?? undefined, metadata: typeof row.metadata === "object" && row.metadata !== null ? (row.metadata as Record<string, unknown>) : undefined, createdAt: row.createdAt }));
  }

  async countJobsForUser(userId: string): Promise<number> {
    return this.prisma.jobListing.count({ where: { userId } });
  }

  async countSourceEventsForUser(userId: string): Promise<number> {
    return this.prisma.sourceEvent.count({ where: { userId } });
  }
}
