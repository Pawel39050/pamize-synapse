-- Compliance Guardian / isolated Neon Preview only
-- Official reference: EUR-Lex CELEX 32016R0679R(02), English, OJ L 127/2, 23 May 2018
-- This is a corrigendum register, NOT a second full legal-act snapshot.
CREATE TABLE IF NOT EXISTS public.compliance_legal_corrigenda (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 base_celex TEXT NOT NULL,
 corrigendum_celex TEXT NOT NULL,
 language_code TEXT NOT NULL,
 publication_date DATE NOT NULL,
 official_url TEXT NOT NULL,
 affected_articles INTEGER[] NOT NULL,
 affected_recitals INTEGER[] NOT NULL DEFAULT '{}',
 verification_status TEXT NOT NULL CHECK (verification_status IN ('reference-confirmed','text-verified')),
 review_required BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(corrigendum_celex,language_code)
);
INSERT INTO public.compliance_legal_corrigenda
(base_celex,corrigendum_celex,language_code,publication_date,official_url,affected_articles,affected_recitals,verification_status)
VALUES ('32016R0679','32016R0679R(02)','EN','2018-05-23',
'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679R(02)',
ARRAY[37,41,42,43,57,64,65,69,70],ARRAY[71],'reference-confirmed')
ON CONFLICT (corrigendum_celex,language_code) DO NOTHING;
