import { defaultMvpSourcePolicies, evaluateSourcePolicy, type AcquisitionMethod, type SourcePolicy } from "@job-search-automation/shared";

export interface AuditInput {
  userId?: string;
  actor: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export interface UserInput {
  id: string;
  email: string;
  name?: string;
}

export interface ConsentInput {
  userId: string;
  consentType: string;
  version: string;
  scope?: unknown;
}

export interface ImportLinkInput {
  userId: string;
  provider: string;
  sourceUrl: string;
  title: string;
  companyName: string;
  location?: string;
}

export interface SourceEventRecord {
  id: string;
  userId: string;
  sourcePolicyId: string;
  provider: string;
  acquisitionMethod: AcquisitionMethod;
  sourceUrl?: string;
}

export interface JobListingRecord {
  id: string;
  userId: string;
  sourceEventId: string;
  title: string;
  companyName: string;
  location?: string | null;
  sourceProvider: string;
  sourceUrl: string;
}

export interface AuditRecord extends AuditInput {
  id: string;
  createdAt: Date;
}

export interface AppStore {
  upsertUser(input: UserInput): Promise<void>;
  grantConsent(input: ConsentInput): Promise<void>;
  revokeConsent(userId: string, consentType: string): Promise<void>;
  hasActiveConsent(userId: string, consentType: string): Promise<boolean>;
  listSourcePolicies(): Promise<SourcePolicy[]>;
  seedDefaultSourcePolicies(): Promise<void>;
  checkSourcePolicy(input: { userId: string; provider: string; acquisitionMethod: AcquisitionMethod; hasRequiredConsent: boolean }): Promise<SourcePolicy>;
  createManualImport(input: ImportLinkInput): Promise<{ sourceEvent: SourceEventRecord; job: JobListingRecord }>;
  writeAudit(event: AuditInput): Promise<void>;
  listAuditEventsForDevAdmin(limit: number): Promise<AuditRecord[]>;
  countJobsForUser(userId: string): Promise<number>;
  countSourceEventsForUser(userId: string): Promise<number>;
}

let sequence = 0;
function id(prefix: string): string {
  sequence += 1;
  return `${prefix}_${sequence}`;
}

export class InMemoryStore implements AppStore {
  users = new Map<string, UserInput>();
  consents: Array<ConsentInput & { revokedAt?: Date }> = [];
  policies = new Map<string, SourcePolicy & { id: string }>();
  sourceEvents: SourceEventRecord[] = [];
  jobs: JobListingRecord[] = [];
  audit: AuditRecord[] = [];

  async upsertUser(input: UserInput): Promise<void> {
    this.users.set(input.id, input);
  }

  async grantConsent(input: ConsentInput): Promise<void> {
    this.consents.forEach((consent) => {
      if (consent.userId === input.userId && consent.consentType === input.consentType && !consent.revokedAt) {
        consent.revokedAt = new Date();
      }
    });
    this.consents.push(input);
  }

  async revokeConsent(userId: string, consentType: string): Promise<void> {
    this.consents.forEach((consent) => {
      if (consent.userId === userId && consent.consentType === consentType && !consent.revokedAt) {
        consent.revokedAt = new Date();
      }
    });
  }

  async hasActiveConsent(userId: string, consentType: string): Promise<boolean> {
    return this.consents.some((consent) => consent.userId === userId && consent.consentType === consentType && !consent.revokedAt);
  }

  async listSourcePolicies(): Promise<SourcePolicy[]> {
    return Array.from(this.policies.values()).map(({ id: _id, ...policy }) => policy);
  }

  async seedDefaultSourcePolicies(): Promise<void> {
    for (const policy of defaultMvpSourcePolicies) {
      this.policies.set(`${policy.provider}:${policy.acquisitionMethod}`, { ...policy, id: id("policy") });
    }
  }

  async checkSourcePolicy(input: { userId: string; provider: string; acquisitionMethod: AcquisitionMethod; hasRequiredConsent: boolean }): Promise<SourcePolicy> {
    const policies = await this.listSourcePolicies();
    const decision = evaluateSourcePolicy(input.provider, input.acquisitionMethod, policies, input.hasRequiredConsent);
    await this.writeAudit({
      userId: input.userId,
      actor: "system",
      action: "source_policy_checked",
      targetType: "source_policy",
      metadata: { provider: input.provider, acquisitionMethod: input.acquisitionMethod, allowed: decision.allowed, reason: decision.reason },
    });
    if (!decision.allowed || !decision.policy) {
      await this.writeAudit({ userId: input.userId, actor: "system", action: "source_blocked", targetType: "source_policy", metadata: { provider: input.provider, acquisitionMethod: input.acquisitionMethod, reason: decision.reason } });
      const error = new Error(decision.reason);
      error.name = "SourcePolicyDeniedError";
      throw error;
    }
    return decision.policy;
  }

  async createManualImport(input: ImportLinkInput): Promise<{ sourceEvent: SourceEventRecord; job: JobListingRecord }> {
    const policy = this.policies.get(`${input.provider}:manual_user_link`);
    if (!policy) throw new Error("Source policy missing during import");
    const sourceEvent: SourceEventRecord = { id: id("source_event"), userId: input.userId, sourcePolicyId: policy.id, provider: input.provider, acquisitionMethod: "manual_user_link", sourceUrl: input.sourceUrl };
    this.sourceEvents.push(sourceEvent);
    const job: JobListingRecord = { id: id("job"), userId: input.userId, sourceEventId: sourceEvent.id, title: input.title, companyName: input.companyName, location: input.location ?? null, sourceProvider: input.provider, sourceUrl: input.sourceUrl };
    this.jobs.push(job);
    return { sourceEvent, job };
  }

  async writeAudit(event: AuditInput): Promise<void> {
    this.audit.push({ id: id("audit"), createdAt: new Date(), ...event });
  }

  async listAuditEventsForDevAdmin(limit: number): Promise<AuditRecord[]> {
    return this.audit.slice(-limit).reverse();
  }

  async countJobsForUser(userId: string): Promise<number> {
    return this.jobs.filter((job) => job.userId === userId).length;
  }

  async countSourceEventsForUser(userId: string): Promise<number> {
    return this.sourceEvents.filter((event) => event.userId === userId).length;
  }
}
