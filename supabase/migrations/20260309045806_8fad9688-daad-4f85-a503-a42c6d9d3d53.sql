
-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible gallery images (public page)
CREATE POLICY "Anyone can view visible gallery images"
  ON public.gallery_images FOR SELECT
  USING (is_visible = true OR get_user_role_level(auth.uid()) >= 3);

-- Leads+ can insert
CREATE POLICY "Leads+ can insert gallery images"
  ON public.gallery_images FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role_level(auth.uid()) >= 3);

-- Leads+ can update
CREATE POLICY "Leads+ can update gallery images"
  ON public.gallery_images FOR UPDATE
  TO authenticated
  USING (get_user_role_level(auth.uid()) >= 3);

-- Presidents+ can delete
CREATE POLICY "Presidents+ can delete gallery images"
  ON public.gallery_images FOR DELETE
  TO authenticated
  USING (get_user_role_level(auth.uid()) >= 4);

-- Create gallery-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery-images bucket
CREATE POLICY "Anyone can view gallery images storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-images');

CREATE POLICY "Leads+ can upload gallery images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery-images' AND (SELECT get_user_role_level(auth.uid())) >= 3);

CREATE POLICY "Leads+ can update gallery images storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gallery-images' AND (SELECT get_user_role_level(auth.uid())) >= 3);

CREATE POLICY "Presidents+ can delete gallery images storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'gallery-images' AND (SELECT get_user_role_level(auth.uid())) >= 4);
