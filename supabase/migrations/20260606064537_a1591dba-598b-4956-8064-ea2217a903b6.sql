
-- Metadata table
CREATE TABLE public.season_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX season_files_season_id_idx ON public.season_files(season_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.season_files TO anon, authenticated;
GRANT ALL ON public.season_files TO service_role;

ALTER TABLE public.season_files ENABLE ROW LEVEL SECURITY;

-- Personal/local app: allow anyone with the anon key full access.
CREATE POLICY "Anyone can read season files"
  ON public.season_files FOR SELECT
  USING (true);
CREATE POLICY "Anyone can insert season files"
  ON public.season_files FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Anyone can update season files"
  ON public.season_files FOR UPDATE
  USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete season files"
  ON public.season_files FOR DELETE
  USING (true);

-- Storage object access for the 'season-files' bucket
CREATE POLICY "Anyone can read season-files objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'season-files');
CREATE POLICY "Anyone can upload season-files objects"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'season-files');
CREATE POLICY "Anyone can update season-files objects"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'season-files') WITH CHECK (bucket_id = 'season-files');
CREATE POLICY "Anyone can delete season-files objects"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'season-files');
