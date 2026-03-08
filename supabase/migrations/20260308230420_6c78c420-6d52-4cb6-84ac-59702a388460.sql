
-- Add roll_no, admission_year, and id_card_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_no text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admission_year integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_card_url text;

-- Update handle_new_user to store these new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  participant_role_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name, college, course, roll_no, admission_year, id_card_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', NULL),
    COALESCE(NEW.raw_user_meta_data->>'course', NULL),
    COALESCE(NEW.raw_user_meta_data->>'roll_no', NULL),
    CASE WHEN NEW.raw_user_meta_data->>'admission_year' IS NOT NULL 
         THEN (NEW.raw_user_meta_data->>'admission_year')::integer 
         ELSE NULL END,
    COALESCE(NEW.raw_user_meta_data->>'id_card_url', NULL)
  );
  
  SELECT id INTO participant_role_id FROM public.roles WHERE name = 'PARTICIPANT';
  
  IF participant_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, participant_role_id);
  END IF;
  
  RETURN NEW;
END;
$function$;
