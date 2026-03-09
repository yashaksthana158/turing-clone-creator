
-- Add academic_year column to public_team_members
ALTER TABLE public.public_team_members ADD COLUMN academic_year text NOT NULL DEFAULT '2024-25';

-- Create site_settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);

-- Leads+ can insert site settings
CREATE POLICY "Leads+ can insert site settings" ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (get_user_role_level(auth.uid()) >= 3);

-- Leads+ can update site settings
CREATE POLICY "Leads+ can update site settings" ON public.site_settings FOR UPDATE TO authenticated
  USING (get_user_role_level(auth.uid()) >= 3)
  WITH CHECK (get_user_role_level(auth.uid()) >= 3);

-- Presidents+ can delete site settings
CREATE POLICY "Presidents+ can delete site settings" ON public.site_settings FOR DELETE TO authenticated
  USING (get_user_role_level(auth.uid()) >= 4);
