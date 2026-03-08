ALTER TABLE public.overload_events
  ADD COLUMN description text,
  ADD COLUMN event_date text,
  ADD COLUMN event_time text,
  ADD COLUMN venue text,
  ADD COLUMN prizes text,
  ADD COLUMN rules text,
  ADD COLUMN event_format text,
  ADD COLUMN winning_criteria text,
  ADD COLUMN coordinators text,
  ADD COLUMN hero_image_url text,
  ADD COLUMN register_url text;