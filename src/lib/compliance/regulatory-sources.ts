/**
 * Compliance Guardian — regulatory source registry (design-only).
 *
 * Source definitions are not proof of current law. No fetching, parsing,
 * legal inference, client data, or background monitoring happens here.
 * A later ingestion service must validate publication date, version,
 * legal force, applicability and content integrity before use.
 */
export type SourceKind = "binding-law" | "official-guidance" | "legislative-tracker" | "authority-updates";
export type LegalSource = {
  id: string;
  title: string;
  jurisdiction: "EU" | "PL";
  kind: SourceKind;
  officialUrl: string;
  verification: "not-connected";
};

export const legalSources: LegalSource[] = [
  {
    id: "eu-ai-act",
    title: "AI Act — rozporządzenie (UE) 2024/1689",
    jurisdiction: "EU",
    kind: "binding-law",
    officialUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    verification: "not-connected"
  },
  {
    id: "eu-gdpr",
    title: "RODO — rozporządzenie (UE) 2016/679",
    jurisdiction: "EU",
    kind: "binding-law",
    officialUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    verification: "not-connected"
  },
  {
    id: "eu-nis2",
    title: "NIS2 — dyrektywa (UE) 2022/2555",
    jurisdiction: "EU",
    kind: "binding-law",
    officialUrl: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
    verification: "not-connected"
  },
  {
    id: "eu-dora",
    title: "DORA — rozporządzenie (UE) 2022/2554",
    jurisdiction: "EU",
    kind: "binding-law",
    officialUrl: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
    verification: "not-connected"
  },
  {
    id: "pl-dziennik-ustaw",
    title: "Dziennik Ustaw — urzędowe ogłaszanie aktów",
    jurisdiction: "PL",
    kind: "authority-updates",
    officialUrl: "https://dziennikustaw.gov.pl/",
    verification: "not-connected"
  },
  {
    id: "pl-rcl",
    title: "Rządowe Centrum Legislacji",
    jurisdiction: "PL",
    kind: "legislative-tracker",
    officialUrl: "https://rcl.gov.pl/",
    verification: "not-connected"
  },
  {
    id: "pl-uodo",
    title: "Urząd Ochrony Danych Osobowych",
    jurisdiction: "PL",
    kind: "official-guidance",
    officialUrl: "https://uodo.gov.pl/",
    verification: "not-connected"
  },
  {
    id: "eu-edpb",
    title: "Europejska Rada Ochrony Danych",
    jurisdiction: "EU",
    kind: "official-guidance",
    officialUrl: "https://www.edpb.europa.eu/",
    verification: "not-connected"
  }
];

/** Reusable metadata for a future, evidence-based Regulatory Impact Analysis. */
export type RegulatoryChange = {
  id: string;
  sourceId: string;
  documentUrl: string;
  publishedAt: string | null;
  applicableFrom: string | null;
  status: "draft" | "adopted-not-applicable" | "applicable" | "repealed" | "requires-verification";
  affectedAgentKeys: string[];
  assessmentStatus: "not-assessed" | "in-review" | "approved";
  rationale: string;
  reviewedBy: string | null;
};
