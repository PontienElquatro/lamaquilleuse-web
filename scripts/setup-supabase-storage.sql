-- ─── Créer le bucket principal ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lamaquilleuse',
  'lamaquilleuse',
  true,
  5242880,  -- 5 MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── Policies : lecture publique ───────────────────────────────────────
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'lamaquilleuse');

-- ─── Policies : upload authentifié uniquement ──────────────────────────
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lamaquilleuse'
  AND auth.role() = 'authenticated'
);

-- ─── Policies : suppression par propriétaire ───────────────────────────
CREATE POLICY "Owner delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lamaquilleuse'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
