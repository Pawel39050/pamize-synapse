-- Applied only to Neon compliance-guardian-preview (br-bitter-pond-b97srhrd).
-- Preserve the original source extraction; corrected derived extraction stored separately.
CREATE TABLE IF NOT EXISTS public.compliance_legal_article_extractions (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 original_version_id BIGINT NOT NULL REFERENCES public.compliance_legal_act_versions(id),
 parser_revision TEXT NOT NULL,
 articles JSONB NOT NULL CHECK (jsonb_typeof(articles)='array'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(original_version_id,parser_revision)
);
-- One-time GDPR Article 99 boundary correction, equivalent to parser v2:
-- only insert when source has exactly 99 articles and expected signature marker.
INSERT INTO public.compliance_legal_article_extractions(original_version_id,parser_revision,articles)
SELECT id,'eurlex-ti-art-v2-trim-signature',
 jsonb_set(articles,'{98,text}',to_jsonb(trim(split_part(articles->98->>'text','Done at Brussels, 27 April 2016.',1))),false)
FROM public.compliance_legal_act_versions
WHERE id=1 AND celex='32016R0679'
  AND jsonb_array_length(articles)=99
  AND position('Done at Brussels, 27 April 2016.' in articles->98->>'text')>0
ON CONFLICT DO NOTHING;
