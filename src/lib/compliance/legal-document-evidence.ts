/**
 * Legal Intelligence, stage II: evidence-centric review contracts.
 * Records supplied by a collector are UNVERIFIED until a reviewer confirms
 * the underlying official legal document and its authoritative version.
 */
export type LegalEvidenceKind = "legal-act" | "official-guidance" | "announcement";
export type LegalReviewStatus =
  | "awaiting-source-verification"
  | "awaiting-document-review"
  | "verified-no-legal-change"
  | "verified-legal-change";

export interface LegalDocumentEvidence {
  evidenceId: string;
  sourceId: string;
  officialDocumentUrl: string;
  title: string;
  kind: LegalEvidenceKind;
  retrievedAt: string;
  contentSha256: string;
  publishedAt: string | null;
  effectiveAt: string | null;
  actIdentifier: string | null;
  reviewStatus: LegalReviewStatus;
  reviewedAt: string | null;
  reviewerId: string | null;
  reviewNotes: string | null;
}

export type LegalEvidenceValidation =
  | {ok: true; status: "awaiting-document-review"}
  | {ok: false; reason: string};

/** Validate only format and provenance. This does NOT validate legal effect. */
export function validateLegalDocumentEvidence(
  evidence: LegalDocumentEvidence,
  allowedOfficialHosts: readonly string[]
): LegalEvidenceValidation {
  let url: URL;
  try { url = new URL(evidence.officialDocumentUrl); }
  catch { return {ok:false, reason:"Invalid official document URL"}; }
  if (url.protocol !== "https:" || url.username || url.password ||
      !allowedOfficialHosts.includes(url.hostname.toLowerCase())) {
    return {ok:false, reason:"Document URL is not an allowlisted official source"};
  }
  if (!evidence.evidenceId.trim() || !evidence.sourceId.trim() || !evidence.title.trim()) {
    return {ok:false, reason:"Missing evidence identifiers or title"};
  }
  if (!/^[a-f0-9]{64}$/.test(evidence.contentSha256)) {
    return {ok:false, reason:"Invalid SHA-256"};
  }
  const validDate = (value: string | null) => value === null || !Number.isNaN(Date.parse(value));
  if (!validDate(evidence.retrievedAt) || !validDate(evidence.publishedAt) ||
      !validDate(evidence.effectiveAt)) {
    return {ok:false, reason:"Invalid evidence date"};
  }
  if (evidence.reviewStatus !== "awaiting-source-verification" ||
      evidence.reviewedAt !== null || evidence.reviewerId !== null) {
    return {ok:false, reason:"Evidence must enter as unverified and without review attestation"};
  }
  return {ok:true, status:"awaiting-document-review"};
}

/** Source evidence may only advance after explicit source/version checking. */
export function confirmDocumentProvenance(
  evidence: LegalDocumentEvidence,
  allowedOfficialHosts: readonly string[]
): LegalDocumentEvidence {
  const check = validateLegalDocumentEvidence(evidence, allowedOfficialHosts);
  if (!check.ok) throw new Error(check.reason);
  return {...evidence, reviewStatus:"awaiting-document-review"};
}

/** Explicit human attestation is required to assert a change of law. */
export function approveLegalReview(
  evidence: LegalDocumentEvidence,
  decision: "verified-no-legal-change" | "verified-legal-change",
  reviewerId: string,
  reviewedAt: string,
  reviewNotes: string
): LegalDocumentEvidence {
  if (!reviewerId.trim() || !reviewNotes.trim() || Number.isNaN(Date.parse(reviewedAt))) {
    throw new Error("Reviewer, review time and legal justification are required");
  }
  if (evidence.reviewStatus !== "awaiting-document-review") {
    throw new Error("Verify official source and document version before legal approval");
  }
  return {...evidence, reviewStatus:decision, reviewerId, reviewedAt, reviewNotes};
}
