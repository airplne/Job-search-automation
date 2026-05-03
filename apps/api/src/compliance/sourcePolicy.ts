import {
  type AcquisitionMethod,
  type SourceDecision,
  type SourcePolicy,
  defaultMvpSourcePolicies,
  evaluateSourcePolicy,
} from "@job-search-automation/shared";

export type AuditWriter = (event: {
  userId?: string;
  actor: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) => Promise<void> | void;

export async function requireAllowedSource(input: {
  userId: string;
  provider: string;
  acquisitionMethod: AcquisitionMethod;
  hasRequiredConsent: boolean;
  policies?: SourcePolicy[];
  writeAudit?: AuditWriter;
}): Promise<SourceDecision> {
  const decision = evaluateSourcePolicy(
    input.provider,
    input.acquisitionMethod,
    input.policies ?? defaultMvpSourcePolicies,
    input.hasRequiredConsent,
  );

  await input.writeAudit?.({
    userId: input.userId,
    actor: "system",
    action: decision.allowed ? "source_allowed" : "source_blocked",
    targetType: "source_policy",
    metadata: {
      provider: input.provider,
      acquisitionMethod: input.acquisitionMethod,
      reason: decision.reason,
    },
  });

  if (!decision.allowed) {
    const error = new Error(decision.reason);
    error.name = "SourcePolicyDeniedError";
    throw error;
  }

  return decision;
}
