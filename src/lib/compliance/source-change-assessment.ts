/** Detect page-level changes without claiming a change in binding law. */
export interface SourceSnapshot {
  sourceId: string;
  fetchedAt: string;
  sha256: string;
  etag: string | null;
  lastModified: string | null;
}
export type SourceChangeDecision =
  | {status: "baseline"; requiresDocumentReview: false}
  | {status: "unchanged"; requiresDocumentReview: false}
  | {status: "website-content-changed"; requiresDocumentReview: true};

export function assessSourceSnapshot(
  previous: SourceSnapshot | null,
  current: SourceSnapshot
): SourceChangeDecision {
  if (!/^[a-f0-9]{64}$/.test(current.sha256)) {
    throw new Error("Invalid SHA-256 fingerprint");
  }
  if (previous === null) return {status: "baseline", requiresDocumentReview: false};
  if (previous.sourceId !== current.sourceId) throw new Error("Source mismatch");
  if (!/^[a-f0-9]{64}$/.test(previous.sha256)) throw new Error("Invalid previous fingerprint");
  if (previous.sha256 === current.sha256) return {status: "unchanged", requiresDocumentReview: false};
  return {status: "website-content-changed", requiresDocumentReview: true};
}

/**
 * A website-content-changed event is only a triage event. A legal change
 * requires resolving the source's actual legal document, verified versions,
 * publication/application dates, and a separate legal review.
 */
