
-- Add id_card_url column to event_registrations
ALTER TABLE public.event_registrations ADD COLUMN id_card_url text;

-- Create storage bucket for ID cards (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('id-cards', 'id-cards', false);

-- Allow authenticated users to upload their own ID cards
CREATE POLICY "Users can upload own id cards"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own ID cards
CREATE POLICY "Users can view own id cards"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow leads+ to view all ID cards for verification
CREATE POLICY "Leads can view all id cards"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'id-cards' AND get_user_role_level(auth.uid()) >= 3);
