CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  participant_role_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, college, course)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', NULL),
    COALESCE(NEW.raw_user_meta_data->>'course', NULL)
  );
  
  -- Get participant role id
  SELECT id INTO participant_role_id FROM public.roles WHERE name = 'PARTICIPANT';
  
  -- Assign participant role by default
  IF participant_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, participant_role_id);
  END IF;
  
  RETURN NEW;
END;
$function$;