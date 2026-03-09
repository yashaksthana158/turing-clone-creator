
-- Create public_team_members table for the public-facing team page
CREATE TABLE public.public_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  section TEXT NOT NULL, -- e.g. 'faculty', 'council', 'technical', 'executive', 'media', 'pr'
  image_url TEXT,
  linkedin TEXT,
  instagram TEXT,
  github TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible members (public page)
CREATE POLICY "Anyone can view visible team members"
ON public.public_team_members
FOR SELECT
USING (is_visible = true OR get_user_role_level(auth.uid()) >= 3);

-- Team Leads+ can insert
CREATE POLICY "Leads+ can insert team members"
ON public.public_team_members
FOR INSERT
TO authenticated
WITH CHECK (get_user_role_level(auth.uid()) >= 3);

-- Team Leads+ can update
CREATE POLICY "Leads+ can update team members"
ON public.public_team_members
FOR UPDATE
TO authenticated
USING (get_user_role_level(auth.uid()) >= 3);

-- Presidents+ can delete
CREATE POLICY "Presidents+ can delete team members"
ON public.public_team_members
FOR DELETE
TO authenticated
USING (get_user_role_level(auth.uid()) >= 4);

-- Create storage bucket for team member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('team-photos', 'team-photos', true);

-- Storage policies for team-photos bucket
CREATE POLICY "Anyone can view team photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-photos');

CREATE POLICY "Leads+ can upload team photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-photos' AND get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Leads+ can update team photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-photos' AND get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Presidents+ can delete team photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-photos' AND get_user_role_level(auth.uid()) >= 4);
