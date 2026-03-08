
-- Create public bucket for overload assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('overload-assets', 'overload-assets', true);

-- Allow authenticated users with role level 3+ to upload
CREATE POLICY "Leads+ can upload overload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'overload-assets'
  AND get_user_role_level(auth.uid()) >= 3
);

-- Allow authenticated users with role level 3+ to update
CREATE POLICY "Leads+ can update overload assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'overload-assets'
  AND get_user_role_level(auth.uid()) >= 3
);

-- Allow anyone to read (public bucket)
CREATE POLICY "Anyone can view overload assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'overload-assets');

-- Allow leads+ to delete
CREATE POLICY "Leads+ can delete overload assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'overload-assets'
  AND get_user_role_level(auth.uid()) >= 3
);
