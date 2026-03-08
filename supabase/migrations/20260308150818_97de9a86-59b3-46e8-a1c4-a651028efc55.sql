
-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_number TEXT NOT NULL DEFAULT 'CERT-' || substr(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Participants can view their own certificates
CREATE POLICY "Users can view own certificates"
  ON public.certificates FOR SELECT
  USING (user_id = auth.uid() OR get_user_role_level(auth.uid()) >= 4);

-- Presidents+ can issue certificates
CREATE POLICY "Presidents+ can issue certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (get_user_role_level(auth.uid()) >= 4);

-- Presidents+ can delete certificates
CREATE POLICY "Presidents+ can delete certificates"
  ON public.certificates FOR DELETE
  USING (get_user_role_level(auth.uid()) >= 4);

-- Presidents+ can update certificates
CREATE POLICY "Presidents+ can update certificates"
  ON public.certificates FOR UPDATE
  USING (get_user_role_level(auth.uid()) >= 4);
