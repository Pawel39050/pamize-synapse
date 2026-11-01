-- Compliance Guardian Preview only; migration of real corrigendum excerpt pairs.
-- Source: EUR-Lex CELEX 32016R0679R(02), EN, OJ L 127, 23.5.2018.
-- Pairs transcribed from official text; human review required before legal conclusions.
CREATE TABLE IF NOT EXISTS public.compliance_corrigendum_changes (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 corrigendum_celex TEXT NOT NULL,
 language_code TEXT NOT NULL,
 section_ref TEXT NOT NULL,
 previous_text TEXT NOT NULL,
 corrected_text TEXT NOT NULL,
 official_url TEXT NOT NULL,
 verification_status TEXT NOT NULL CHECK (verification_status IN ('source-transcribed-review-required','human-verified')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (corrigendum_celex,language_code,section_ref)
);
