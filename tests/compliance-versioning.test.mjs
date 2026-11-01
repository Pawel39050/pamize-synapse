import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadPureModule(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const {outputText, diagnostics} = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true
  });
  assert.equal(diagnostics?.length ?? 0, 0);
  return import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
}

const {assessSourceSnapshot} = await loadPureModule("../src/lib/compliance/source-change-assessment.ts");
const {compareLegalVersions} = await loadPureModule("../src/lib/compliance/legal-versioning.ts");
const a = "a".repeat(64), b = "b".repeat(64);
const snapshot = (sha256, sourceId="eu-ai-act") => ({
  sourceId, sha256, fetchedAt: "2026-11-01T00:00:00Z", etag: null, lastModified: null
});

test("first fetch creates baseline, not legal alert", () => {
  assert.deepEqual(assessSourceSnapshot(null, snapshot(a)), {
    status: "baseline", requiresDocumentReview: false
  });
});
test("unchanged content does not create alert", () => {
  assert.equal(assessSourceSnapshot(snapshot(a), snapshot(a)).status, "unchanged");
});
test("changed website requires review, not a legal amendment verdict", () => {
  assert.deepEqual(assessSourceSnapshot(snapshot(a), snapshot(b)), {
    status: "website-content-changed", requiresDocumentReview: true
  });
});
test("different sources and malformed hashes are rejected", () => {
  assert.throws(() => assessSourceSnapshot(snapshot(a), snapshot(b, "eu-gdpr")));
  assert.throws(() => assessSourceSnapshot(null, snapshot("incorrect")));
});
const version = (id, hash, sections, verificationStatus="verified") => ({
  sourceId: "eu-ai-act", documentId: "2024/1689", versionId: id,
  officialUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  title: "AI Act", jurisdiction: "EU", publicationDate: null,
  effectiveDate: null, applicationDate: null, retrievedAt: "2026-11-01T00:00:00Z",
  contentSha256: hash, sections, legalStatus: "effective",
  verificationStatus, verifiedBy: "reviewer"
});
test("section diff identifies additions and modifications", () => {
  const result = compareLegalVersions(
    version("v1",a,{"art1":"before"}),
    version("v2",b,{"art1":"after","art2":"new"})
  );
  assert.deepEqual(result.differences.map(x=>x.kind), ["modified","added"]);
  assert.equal(result.requiresLegalReview, true);
});
test("unverified legal versions cannot be compared", () => {
  assert.throws(() => compareLegalVersions(
    version("v1",a,{"art1":"before"},"pending"),
    version("v2",b,{"art1":"after"})
  ));
});
test("same version id with different hash is rejected", () => {
  assert.throws(() => compareLegalVersions(
    version("v1",a,{"art1":"before"}),
    version("v1",b,{"art1":"after"})
  ));
});
