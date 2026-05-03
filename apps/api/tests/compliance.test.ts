import { describe, expect, it } from "vitest";
import {
  defaultMvpSourcePolicies,
  evaluateSourcePolicy,
  explicitProhibitedActions,
  isProhibitedSourceAction,
  type SourcePolicy,
} from "@job-search-automation/shared";

describe("source compliance guardrails", () => {
  it("blocks every explicitly restricted action", () => {
    for (const action of explicitProhibitedActions) {
      expect(isProhibitedSourceAction("example", action), action).toBe(true);
    }
  });

  it("blocks platform-specific restricted variants", () => {
    expect(isProhibitedSourceAction("Indeed", "indeed_scrape")).toBe(true);
    expect(isProhibitedSourceAction("Glassdoor", "glassdoor_scrape")).toBe(true);
    expect(isProhibitedSourceAction("Glassdoor", "bulk_glassdoor_content_copy")).toBe(true);
  });

  it("denies missing source policies by default", () => {
    const decision = evaluateSourcePolicy("unknown", "manual_user_link", defaultMvpSourcePolicies, true);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("No source policy");
  });

  it("denies disabled source policies", () => {
    const disabled: SourcePolicy = { ...defaultMvpSourcePolicies[0], enabled: false };
    const decision = evaluateSourcePolicy("manual", "manual_user_link", [disabled], true);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("disabled");
  });

  it("denies legal-review and do-not-build policies", () => {
    const legalReview: SourcePolicy = { ...defaultMvpSourcePolicies[0], classification: "REQUIRES_LEGAL_REVIEW", enabled: true };
    const doNotBuild: SourcePolicy = { ...defaultMvpSourcePolicies[0], classification: "DO_NOT_BUILD", enabled: true };
    expect(evaluateSourcePolicy("manual", "manual_user_link", [legalReview], true).allowed).toBe(false);
    expect(evaluateSourcePolicy("manual", "manual_user_link", [doNotBuild], true).allowed).toBe(false);
  });

  it("requires consent for allowed MVP manual and CSV policies", () => {
    expect(evaluateSourcePolicy("manual", "manual_user_link", defaultMvpSourcePolicies, false).allowed).toBe(false);
    expect(evaluateSourcePolicy("csv", "csv_upload", defaultMvpSourcePolicies, false).allowed).toBe(false);
    expect(evaluateSourcePolicy("manual", "manual_user_link", defaultMvpSourcePolicies, true).allowed).toBe(true);
    expect(evaluateSourcePolicy("csv", "csv_upload", defaultMvpSourcePolicies, true).allowed).toBe(true);
  });
});
