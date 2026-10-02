ALTER TABLE public.profiles
  ADD COLUMN username_normalized text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_normalized_format
  CHECK (username_normalized IS NULL OR username_normalized ~ '^[a-z0-9_]{3,20}$');

CREATE UNIQUE INDEX profiles_username_normalized_unique
  ON public.profiles (username_normalized)
  WHERE username_normalized IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_username text;
BEGIN
  requested_username := lower(NULLIF(NEW.raw_user_meta_data ->> 'username_normalized', ''));

  IF requested_username IS NOT NULL AND requested_username !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Invalid username';
  END IF;

  INSERT INTO public.profiles (id, display_name, username_normalized)
  VALUES (
    NEW.id,
    LEFT(COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), requested_username, 'Climber'), 24),
    requested_username
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;