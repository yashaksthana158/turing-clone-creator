-- =====================
-- RLS POLICIES
-- =====================

-- ROLES TABLE: Public read, only super admin can modify
CREATE POLICY "Anyone can view roles" ON public.roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can insert roles" ON public.roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Super admins can update roles" ON public.roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- USER_ROLES TABLE: Users see own, admins see all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role_level(auth.uid()) >= 4);

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Super admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Super admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- PROFILES TABLE: Own profile or higher roles can view
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- TEAMS TABLE: All authenticated can view, leads+ can manage
CREATE POLICY "Authenticated can view teams" ON public.teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Presidents+ can create teams" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (public.get_user_role_level(auth.uid()) >= 4);

CREATE POLICY "Presidents+ can update teams" ON public.teams
  FOR UPDATE TO authenticated USING (public.get_user_role_level(auth.uid()) >= 4);

CREATE POLICY "Super admins can delete teams" ON public.teams
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- TEAM_MEMBERS TABLE
CREATE POLICY "Authenticated can view team members" ON public.team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team leads+ can add members" ON public.team_members
  FOR INSERT TO authenticated WITH CHECK (
    public.is_team_lead(auth.uid(), team_id) OR public.get_user_role_level(auth.uid()) >= 4
  );

CREATE POLICY "Team leads+ can update members" ON public.team_members
  FOR UPDATE TO authenticated USING (
    public.is_team_lead(auth.uid(), team_id) OR public.get_user_role_level(auth.uid()) >= 4
  );

CREATE POLICY "Team leads+ can remove members" ON public.team_members
  FOR DELETE TO authenticated USING (
    public.is_team_lead(auth.uid(), team_id) OR public.get_user_role_level(auth.uid()) >= 4
  );

-- EVENTS TABLE
CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT TO authenticated USING (
    status = 'PUBLISHED' OR 
    created_by = auth.uid() OR 
    public.is_team_member(auth.uid(), team_id) OR
    public.get_user_role_level(auth.uid()) >= 4
  );

CREATE POLICY "Team members can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (
    public.get_user_role_level(auth.uid()) >= 2
  );

CREATE POLICY "Creator or leads can update events" ON public.events
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR 
    public.is_team_lead(auth.uid(), team_id) OR
    public.get_user_role_level(auth.uid()) >= 4
  );

CREATE POLICY "Presidents+ can delete events" ON public.events
  FOR DELETE TO authenticated USING (public.get_user_role_level(auth.uid()) >= 4);

-- EVENT_REGISTRATIONS TABLE
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR 
    public.get_user_role_level(auth.uid()) >= 3
  );

CREATE POLICY "Authenticated can register for events" ON public.event_registrations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own registration" ON public.event_registrations
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can cancel own registration" ON public.event_registrations
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TASKS TABLE
CREATE POLICY "Team members can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (
    assigned_to = auth.uid() OR 
    public.is_team_member(auth.uid(), team_id) OR
    public.get_user_role_level(auth.uid()) >= 4
  );

CREATE POLICY "Team leads can create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (
    public.is_team_lead(auth.uid(), team_id) OR public.get_user_role_level(auth.uid()) >= 3
  );

CREATE POLICY "Assigned user or leads can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (
    assigned_to = auth.uid() OR 
    public.is_team_lead(auth.uid(), team_id) OR
    public.get_user_role_level(auth.uid()) >= 4
  );

CREATE POLICY "Team leads can delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (
    public.is_team_lead(auth.uid(), team_id) OR public.get_user_role_level(auth.uid()) >= 4
  );

-- APPROVALS TABLE
CREATE POLICY "Relevant users can view approvals" ON public.approvals
  FOR SELECT TO authenticated USING (
    reviewed_by = auth.uid() OR public.get_user_role_level(auth.uid()) >= 3
  );

CREATE POLICY "Leads+ can create approvals" ON public.approvals
  FOR INSERT TO authenticated WITH CHECK (public.get_user_role_level(auth.uid()) >= 3);

CREATE POLICY "Reviewers can update approvals" ON public.approvals
  FOR UPDATE TO authenticated USING (
    reviewed_by = auth.uid() OR public.get_user_role_level(auth.uid()) >= 4
  );

-- PERMISSIONS TABLE: Public read, super admin write
CREATE POLICY "Anyone can view permissions" ON public.permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage permissions" ON public.permissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- ROLE_PERMISSIONS TABLE: Public read, super admin write
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage role permissions" ON public.role_permissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- AUDIT_LOGS TABLE: Only high-level admins
CREATE POLICY "Presidents+ can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.get_user_role_level(auth.uid()) >= 4);

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);