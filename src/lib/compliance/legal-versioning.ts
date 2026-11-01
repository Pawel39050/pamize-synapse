/** Versioned legal document metadata. The connector never treats retrieved text as instructions. */
export type LegalStatus = "draft" | "published" | "effective" | "amended" | "repealed" | "unverified";
export interface LegalDocumentVersion {
  sourceId: string;
  documentId: string;
  versionId: string;
  officialUrl: string;
  title: string;
  jurisdiction: "EU" | "PL";
  publicationDate: string | null;
  effectiveDate: string | null;
  applicationDate: string | null;
  retrievedAt: string;
  contentSha256: string;
  sections: Record<string, string>;
  legalStatus: LegalStatus;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedBy: string | null;
}
export interface SectionDifference {
  section: string;
  kind: "added" | "removed" | "modified";
  previous: string | null;
  current: string | null;
}
export interface LegalVersionDiff {
  documentId: string;
  previousVersionId: string;
  currentVersionId: string;
  changed: boolean;
  differences: SectionDifference[];
  requiresLegalReview: true;
}
/**
 * Compare two snapshots of the SAME document. This is an exact text comparison,
 * not a legal interpretation, AI assessment or change-of-law notification.
 * Diff must be reviewed before any downstream regulatory impact analysis.
 */
export function compareLegalVersions(previous: LegalDocumentVersion, current: LegalDocumentVersion): LegalVersionDiff {
  if (previous.documentId !== current.documentId || previous.sourceId !== current.sourceId) {
    throw new Error("Cannot compare different legal documents");
  }
  if (previous.versionId === current.versionId && previous.contentSha256 !== current.contentSha256) {
    throw new Error("Conflicting content for one document version");
  }
  if (previous.verificationStatus !== "verified" || current.verificationStatus !== "verified") {
    throw new Error("Only verified legal snapshots can be compared");
  }
  const allSections = [...new Set([...Object.keys(previous.sections), ...Object.keys(current.sections)])].sort();
  const differences: SectionDifference[] = [];
  for (const section of allSections) {
    const oldText = Object.prototype.hasOwnProperty.call(previous.sections, section) ? previous.sections[section] : null;
    const newText = Object.prototype.hasOwnProperty.call(current.sections, section) ? current.sections[section] : null;
    if (oldText === newText) continue;
    differences.push({
      section,
      kind: oldText === null ? "added" : newText === null ? "removed" : "modified",
      previous: oldText,
      current: newText
    });
  }
  return {
    documentId: current.documentId,
    previousVersionId: previous.versionId,
    currentVersionId: current.versionId,
    changed: previous.contentSha256 !== current.contentSha256 || differences.length > 0,
    differences,
    requiresLegalReview: true
  };
}
