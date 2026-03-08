-- Fix security: add search_path to functions missing it
CREATE OR REPLACE FUNCTION public.get_role_level(_role app_role)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'SUPER_ADMIN' THEN 5
    WHEN 'PRESIDENT' THEN 4
    WHEN 'TEAM_LEAD' THEN 3
    WHEN 'TEAM_MEMBER' THEN 2
    WHEN 'PARTICIPANT' THEN 1
    ELSE 0
  END
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_role_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Get participant role id
  SELECT id INTO participant_role_id FROM public.roles WHERE name = 'PARTICIPANT';
  
  -- Assign participant role by default
  IF participant_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, participant_role_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix audit log policy to be more restrictive
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());