-- Add storage_path column to gallery_images
ALTER TABLE public.gallery_images ADD COLUMN IF NOT EXISTS storage_path text;

-- Add index for common gallery query pattern
CREATE INDEX IF NOT EXISTS idx_gallery_images_year_cat_visible 
  ON public.gallery_images (year, category, is_visible);

-- Allow anon and authenticated users to upload to pending/ in id-cards bucket
CREATE POLICY "Allow pending uploads for anon"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = 'pending');

CREATE POLICY "Allow pending uploads for authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = 'pending');