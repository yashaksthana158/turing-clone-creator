
-- Add poster_url column to events
ALTER TABLE public.events ADD COLUMN poster_url text;

-- Create storage bucket for event posters
INSERT INTO storage.buckets (id, name, public) VALUES ('event-posters', 'event-posters', true);

-- Allow authenticated users to upload posters
CREATE POLICY "Authenticated can upload event posters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-posters');

-- Allow anyone to view event posters
CREATE POLICY "Anyone can view event posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-posters');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own event posters"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'event-posters' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own event posters"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-posters' AND (auth.uid())::text = (storage.foldername(name))[1]);
