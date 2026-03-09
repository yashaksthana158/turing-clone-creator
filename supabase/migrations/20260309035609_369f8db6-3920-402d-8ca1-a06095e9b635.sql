
-- Add UNIQUE constraint on event_registrations (event_id, user_id)
ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_event_user_unique UNIQUE (event_id, user_id);

-- Add UNIQUE constraint on overload_event_registrations (overload_event_id, user_id)
ALTER TABLE public.overload_event_registrations
  ADD CONSTRAINT overload_event_registrations_event_user_unique UNIQUE (overload_event_id, user_id);

-- Add UNIQUE constraint on user_roles (user_id, role_id) if not already present
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id);
