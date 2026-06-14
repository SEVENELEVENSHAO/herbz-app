CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE entry_kind AS ENUM ('formula', 'herb', 'article');

CREATE TABLE source_documents (
  id text PRIMARY KEY,
  title text NOT NULL,
  english_title text,
  edition text,
  file_name text NOT NULL,
  page_count integer,
  language text NOT NULL DEFAULT 'zh',
  copyright_scope text NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reference_entries (
  id text PRIMARY KEY,
  kind entry_kind NOT NULL,
  chinese_name text NOT NULL,
  pinyin text,
  english_name text,
  category text,
  summary text,
  search_text text GENERATED ALWAYS AS (
    coalesce(chinese_name, '') || ' ' || coalesce(pinyin, '') || ' ' ||
    coalesce(english_name, '') || ' ' || coalesce(category, '') || ' ' ||
    coalesce(summary, '')
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reference_entries_search_idx
  ON reference_entries USING gin (search_text gin_trgm_ops);

CREATE TABLE formula_variants (
  id text PRIMARY KEY REFERENCES reference_entries(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]',
  indications text,
  preparation text,
  mechanism text,
  analysis text,
  applications text,
  modifications text,
  cautions text,
  comparisons text,
  cases text,
  formula_song text,
  source_variant_key text
);

CREATE TABLE herbs (
  id text PRIMARY KEY REFERENCES reference_entries(id) ON DELETE CASCADE,
  source text,
  properties jsonb NOT NULL DEFAULT '[]',
  channels jsonb NOT NULL DEFAULT '[]',
  functions text,
  applications text,
  dosage text,
  preparation text,
  cautions text,
  comparisons text,
  modern_research text,
  adverse_reactions text,
  toxicity text
);

CREATE TABLE formula_ingredients (
  formula_id text NOT NULL REFERENCES formula_variants(id) ON DELETE CASCADE,
  herb_id text REFERENCES herbs(id),
  position integer NOT NULL,
  source_name text NOT NULL,
  dose text,
  preparation text,
  role text,
  PRIMARY KEY (formula_id, position)
);

CREATE TABLE clinical_usages (
  id text PRIMARY KEY,
  formula_id text NOT NULL REFERENCES formula_variants(id) ON DELETE CASCADE,
  organ_system text,
  condition_name text,
  pattern_name text NOT NULL,
  treatment_principle text,
  source_context text
);

CREATE TABLE source_passages (
  id bigserial PRIMARY KEY,
  document_id text NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  entry_id text REFERENCES reference_entries(id) ON DELETE SET NULL,
  field_name text,
  page_number integer NOT NULL,
  original_text text NOT NULL,
  normalized_text text,
  english_translation text,
  verification verification_status NOT NULL DEFAULT 'pending',
  confidence numeric(4,3),
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX source_passages_entry_idx ON source_passages(entry_id);
CREATE INDEX source_passages_review_idx ON source_passages(verification, document_id, page_number);
CREATE INDEX source_passages_search_idx
  ON source_passages USING gin ((coalesce(original_text, '') || ' ' || coalesce(normalized_text, '')) gin_trgm_ops);

CREATE TABLE user_bookmarks (
  user_id text NOT NULL,
  entry_id text NOT NULL REFERENCES reference_entries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entry_id)
);

CREATE TABLE study_progress (
  user_id text NOT NULL,
  entry_id text NOT NULL REFERENCES reference_entries(id) ON DELETE CASCADE,
  ease numeric(4,2) NOT NULL DEFAULT 2.50,
  interval_days integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  last_result smallint,
  PRIMARY KEY (user_id, entry_id)
);
