export type SourceClassification =
  | "SAFE_FOR_MVP"
  | "SAFE_WITH_EXPLICIT_USER_CONSENT"
  | "REQUIRES_LEGAL_REVIEW"
  | "DO_NOT_BUILD";

export type AcquisitionMethod =
  | "manual_user_link"
  | "csv_upload"
  | "user_authorized_email_alert"
  | "official_api"
  | "browser_extension_user_click"
  | "scrape"
  | "indeed_scrape"
  | "glassdoor_scrape"
  | "headless_browser"
  | "platform_automation"
  | "bulk_content_copy"
  | "bulk_glassdoor_content_copy"
  | "captcha_bypass"
  | "anti_bot_evasion"
  | "credential_collection"
  | "cookie_session_replay"
  | "auto_apply"
  | "auto_message"
  | "auto_save_on_platform"
  | "screening_answer_automation";

export interface SourcePolicy {
  provider: string;
  acquisitionMethod: AcquisitionMethod;
  classification: SourceClassification;
  enabled: boolean;
  requiresConsent: boolean;
  legalStatus: string;
  allowedData: string[];
  disallowedData: string[];
  retentionNote: string;
}

export interface SourceDecision {
  allowed: boolean;
  reason: string;
  policy?: SourcePolicy;
}

export const explicitProhibitedActions: readonly AcquisitionMethod[] = [
  "scrape",
  "indeed_scrape",
  "glassdoor_scrape",
  "headless_browser",
  "platform_automation",
  "bulk_content_copy",
  "bulk_glassdoor_content_copy",
  "captcha_bypass",
  "anti_bot_evasion",
  "credential_collection",
  "cookie_session_replay",
  "auto_apply",
  "auto_message",
  "auto_save_on_platform",
  "screening_answer_automation",
] as const;

const prohibitedProviders = new Set(["indeed", "glassdoor"]);
const prohibitedMethods = new Set<AcquisitionMethod>(explicitProhibitedActions);

export function normalizeProvider(provider: string): string {
  return provider.trim().toLowerCase();
}

export function isProhibitedSourceAction(provider: string, method: AcquisitionMethod): boolean {
  const normalizedProvider = normalizeProvider(provider);
  if (prohibitedMethods.has(method)) return true;
  if (prohibitedProviders.has(normalizedProvider) && method !== "user_authorized_email_alert" && method !== "manual_user_link") {
    return true;
  }
  return false;
}

export function evaluateSourcePolicy(
  provider: string,
  method: AcquisitionMethod,
  policies: SourcePolicy[],
  hasRequiredConsent: boolean,
): SourceDecision {
  if (isProhibitedSourceAction(provider, method)) {
    return { allowed: false, reason: `Prohibited source action: ${provider}/${method}` };
  }

  const normalizedProvider = normalizeProvider(provider);
  const policy = policies.find(
    (candidate) => normalizeProvider(candidate.provider) === normalizedProvider && candidate.acquisitionMethod === method,
  );

  if (!policy) return { allowed: false, reason: "No source policy registered" };
  if (!policy.enabled) return { allowed: false, reason: "Source policy is disabled", policy };
  if (policy.classification === "DO_NOT_BUILD") return { allowed: false, reason: "Source classification is do not build", policy };
  if (policy.classification === "REQUIRES_LEGAL_REVIEW") return { allowed: false, reason: "Source requires legal review", policy };
  if (policy.requiresConsent && !hasRequiredConsent) return { allowed: false, reason: "Required consent is missing", policy };

  return { allowed: true, reason: "Source allowed", policy };
}

export const defaultMvpSourcePolicies: SourcePolicy[] = [
  {
    provider: "manual",
    acquisitionMethod: "manual_user_link",
    classification: "SAFE_FOR_MVP",
    enabled: true,
    requiresConsent: true,
    legalStatus: "approved_for_mvp_manual_entry_only",
    allowedData: ["user_provided_url", "user_entered_job_fields"],
    disallowedData: ["credentials", "cookies", "automated_page_fetch", "platform_actions"],
    retentionNote: "User-controlled retention; delete/export with account data.",
  },
  {
    provider: "csv",
    acquisitionMethod: "csv_upload",
    classification: "SAFE_FOR_MVP",
    enabled: true,
    requiresConsent: true,
    legalStatus: "approved_for_mvp_user_uploaded_files",
    allowedData: ["user_uploaded_rows", "mapped_job_fields"],
    disallowedData: ["hidden_external_fetches", "credentials", "cookies"],
    retentionNote: "User-controlled retention; row-level errors should avoid raw sensitive data.",
  },
  ...explicitProhibitedActions.map((acquisitionMethod) => ({
    provider: acquisitionMethod.includes("glassdoor") ? "glassdoor" : acquisitionMethod.includes("indeed") ? "indeed" : "all",
    acquisitionMethod,
    classification: "DO_NOT_BUILD" as const,
    enabled: false,
    requiresConsent: false,
    legalStatus: "prohibited_by_product_boundary",
    allowedData: [],
    disallowedData: ["prohibited_product_capability"],
    retentionNote: "No data should be collected through this method.",
  })),
];
