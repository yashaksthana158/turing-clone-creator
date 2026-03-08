
-- Overload editions (per-year festival metadata)
CREATE TABLE public.overload_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  date_label TEXT,
  venue TEXT,
  description TEXT,
  hero_image_url TEXT,
  banner_image_url TEXT,
  register_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.overload_editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published editions" ON public.overload_editions
  FOR SELECT USING (is_published = true OR get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Leads+ can insert editions" ON public.overload_editions
  FOR INSERT WITH CHECK (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Leads+ can update editions" ON public.overload_editions
  FOR UPDATE USING (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Presidents+ can delete editions" ON public.overload_editions
  FOR DELETE USING (get_user_role_level(auth.uid()) >= 4);

-- Overload events (sub-events per edition)
CREATE TABLE public.overload_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.overload_editions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  image_url TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.overload_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view overload events" ON public.overload_events
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.overload_editions e WHERE e.id = edition_id AND (e.is_published = true OR get_user_role_level(auth.uid()) >= 3)));

CREATE POLICY "Leads+ can insert overload events" ON public.overload_events
  FOR INSERT WITH CHECK (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Leads+ can update overload events" ON public.overload_events
  FOR UPDATE USING (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Presidents+ can delete overload events" ON public.overload_events
  FOR DELETE USING (get_user_role_level(auth.uid()) >= 4);

-- Overload schedule
CREATE TABLE public.overload_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.overload_editions(id) ON DELETE CASCADE,
  time_label TEXT NOT NULL,
  venue TEXT,
  event_name TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.overload_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view overload schedule" ON public.overload_schedule
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.overload_editions e WHERE e.id = edition_id AND (e.is_published = true OR get_user_role_level(auth.uid()) >= 3)));

CREATE POLICY "Leads+ can insert overload schedule" ON public.overload_schedule
  FOR INSERT WITH CHECK (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Leads+ can update overload schedule" ON public.overload_schedule
  FOR UPDATE USING (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Presidents+ can delete overload schedule" ON public.overload_schedule
  FOR DELETE USING (get_user_role_level(auth.uid()) >= 4);

-- Overload sponsors
CREATE TABLE public.overload_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.overload_editions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.overload_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view overload sponsors" ON public.overload_sponsors
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.overload_editions e WHERE e.id = edition_id AND (e.is_published = true OR get_user_role_level(auth.uid()) >= 3)));

CREATE POLICY "Leads+ can insert overload sponsors" ON public.overload_sponsors
  FOR INSERT WITH CHECK (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Leads+ can update overload sponsors" ON public.overload_sponsors
  FOR UPDATE USING (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Presidents+ can delete overload sponsors" ON public.overload_sponsors
  FOR DELETE USING (get_user_role_level(auth.uid()) >= 4);

-- Overload gallery
CREATE TABLE public.overload_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.overload_editions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.overload_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view overload gallery" ON public.overload_gallery
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.overload_editions e WHERE e.id = edition_id AND (e.is_published = true OR get_user_role_level(auth.uid()) >= 3)));

CREATE POLICY "Leads+ can insert overload gallery" ON public.overload_gallery
  FOR INSERT WITH CHECK (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Leads+ can update overload gallery" ON public.overload_gallery
  FOR UPDATE USING (get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Presidents+ can delete overload gallery" ON public.overload_gallery
  FOR DELETE USING (get_user_role_level(auth.uid()) >= 4);
