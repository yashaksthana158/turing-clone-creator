
-- Allow presidents+ to delete approvals (for event cleanup)
CREATE POLICY "Presidents+ can delete approvals"
ON public.approvals
FOR DELETE
TO authenticated
USING (get_user_role_level(auth.uid()) >= 4);

-- Allow presidents+ to delete event registrations (for event cleanup)
DROP POLICY IF EXISTS "Users can cancel own registration" ON public.event_registrations;
CREATE POLICY "Users or presidents can delete registration"
ON public.event_registrations
FOR DELETE
TO authenticated
USING ((user_id = auth.uid()) OR (get_user_role_level(auth.uid()) >= 4));
