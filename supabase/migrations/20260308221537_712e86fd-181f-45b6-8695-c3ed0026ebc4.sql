
-- Create overload event registrations table
CREATE TABLE public.overload_event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overload_event_id uuid NOT NULL REFERENCES public.overload_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status public.registration_status NOT NULL DEFAULT 'REGISTERED',
  id_card_url text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(overload_event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.overload_event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can register
CREATE POLICY "Authenticated can register for overload events"
  ON public.overload_event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view own, leads can view all
CREATE POLICY "Users can view own overload registrations"
  ON public.overload_event_registrations FOR SELECT
  USING (user_id = auth.uid() OR get_user_role_level(auth.uid()) >= 3);

-- Users or leads can update
CREATE POLICY "Users or leads can update overload registration"
  ON public.overload_event_registrations FOR UPDATE
  USING (user_id = auth.uid() OR get_user_role_level(auth.uid()) >= 3);

-- Presidents can delete
CREATE POLICY "Presidents can delete overload registration"
  ON public.overload_event_registrations FOR DELETE
  USING (get_user_role_level(auth.uid()) >= 4);
