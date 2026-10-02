CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Climber' CHECK (char_length(display_name) BETWEEN 1 AND 24),
  selected_character text NOT NULL DEFAULT 'normal' CHECK (selected_character IN ('normal', 'medieval', 'fire', 'desert')),
  high_score integer NOT NULL DEFAULT 0 CHECK (high_score >= 0),
  highest_height integer NOT NULL DEFAULT 0 CHECK (highest_height >= 0),
  best_accuracy integer NOT NULL DEFAULT 0 CHECK (best_accuracy BETWEEN 0 AND 100),
  best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Players can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Players can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.game_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_name text NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 24),
  completion_time_ms integer NOT NULL CHECK (completion_time_ms > 0),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  accuracy integer NOT NULL DEFAULT 0 CHECK (accuracy BETWEEN 0 AND 100),
  best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_results TO anon;
GRANT SELECT, INSERT, DELETE ON public.game_results TO authenticated;
GRANT ALL ON public.game_results TO service_role;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view completed runs" ON public.game_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Players can create own results" ON public.game_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can delete own results" ON public.game_results FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX game_results_fastest_idx ON public.game_results (completion_time_ms ASC, created_at ASC);
CREATE INDEX game_results_user_idx ON public.game_results (user_id, completion_time_ms ASC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, LEFT(COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), split_part(COALESCE(NEW.email, 'Climber'), '@', 1), 'Climber'), 24))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();