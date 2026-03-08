
-- Drop the existing update policy and recreate with team lead access
DROP POLICY IF EXISTS "Users can update own registration" ON public.event_registrations;

CREATE POLICY "Users or leads can update registration"
ON public.event_registrations
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) OR (get_user_role_level(auth.uid()) >= 3)
);
