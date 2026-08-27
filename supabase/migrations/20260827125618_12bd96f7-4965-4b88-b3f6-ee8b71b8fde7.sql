
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  bike TEXT,
  disciplines TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Trilha',
  notes TEXT,
  sport TEXT NOT NULL DEFAULT 'trail',
  visibility TEXT NOT NULL DEFAULT 'private',
  distance_m DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_s INTEGER NOT NULL DEFAULT 0,
  moving_time_s INTEGER NOT NULL DEFAULT 0,
  avg_speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 0,
  max_speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 0,
  elevation_gain_m DOUBLE PRECISION NOT NULL DEFAULT 0,
  min_altitude_m DOUBLE PRECISION,
  max_altitude_m DOUBLE PRECISION,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  place_label TEXT,
  track JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activities_user_started_idx ON public.activities (user_id, started_at DESC);
CREATE INDEX activities_visibility_idx ON public.activities (visibility, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select_own" ON public.activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "activities_select_public" ON public.activities FOR SELECT TO authenticated USING (visibility = 'public');
CREATE POLICY "activities_insert_own" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_update_own" ON public.activities FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_delete_own" ON public.activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE TABLE public.activity_likes (
  activity_id UUID NOT NULL REFERENCES public.activities ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.activity_likes TO authenticated;
GRANT ALL ON public.activity_likes TO service_role;
ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select" ON public.activity_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert_own" ON public.activity_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.activity_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_comments TO authenticated;
GRANT ALL ON public.activity_comments TO service_role;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON public.activity_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON public.activity_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.activity_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    lower(split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)) || '_' || substr(NEW.id::text, 1, 4)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
