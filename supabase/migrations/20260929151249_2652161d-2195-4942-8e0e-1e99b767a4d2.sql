CREATE TABLE public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','playing','finished')),
  course_seed integer NOT NULL DEFAULT 1,
  max_players integer NOT NULL DEFAULT 10,
  started_at timestamptz,
  winner_id uuid,
  winner_name text,
  winner_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  character text NOT NULL DEFAULT 'normal',
  finish_time_ms integer,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
GRANT SELECT ON public.game_rooms TO authenticated;
GRANT SELECT, DELETE ON public.room_players TO authenticated;
GRANT ALL ON public.game_rooms TO service_role;
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_room_member(_room uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_players WHERE room_id = _room AND user_id = auth.uid())
$$;

CREATE POLICY "Members view room" ON public.game_rooms FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR public.is_room_member(id));
CREATE POLICY "Members view players" ON public.room_players FOR SELECT TO authenticated
  USING (public.is_room_member(room_id));
CREATE POLICY "Players leave rooms" ON public.room_players FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_room(_name text, _character text)
RETURNS public.game_rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.game_rooms; c text; tries int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  LOOP
    c := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.game_rooms WHERE code = c);
    tries := tries + 1; IF tries > 20 THEN RAISE EXCEPTION 'Could not create code'; END IF;
  END LOOP;
  INSERT INTO public.game_rooms (code, host_id, course_seed)
  VALUES (c, auth.uid(), 2 + floor(random() * 60)::int) RETURNING * INTO r;
  INSERT INTO public.room_players (room_id, user_id, player_name, character)
  VALUES (r.id, auth.uid(), left(coalesce(nullif(_name,''),'Climber'),24), coalesce(nullif(_character,''),'normal'));
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.join_room(_code text, _name text, _character text)
RETURNS public.game_rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.game_rooms; n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO r FROM public.game_rooms WHERE code = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.room_players WHERE room_id = r.id AND user_id = auth.uid()) THEN RETURN r; END IF;
  IF r.status <> 'lobby' THEN RAISE EXCEPTION 'Race already started'; END IF;
  SELECT count(*) INTO n FROM public.room_players WHERE room_id = r.id;
  IF n >= r.max_players THEN RAISE EXCEPTION 'Room is full'; END IF;
  INSERT INTO public.room_players (room_id, user_id, player_name, character)
  VALUES (r.id, auth.uid(), left(coalesce(nullif(_name,''),'Climber'),24), coalesce(nullif(_character,''),'normal'));
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.start_room(_room uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.game_rooms SET status = 'playing', started_at = now()
  WHERE id = _room AND host_id = auth.uid() AND status = 'lobby';
  IF NOT FOUND THEN RAISE EXCEPTION 'Only the host can start'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.finish_room(_room uuid, _time_ms integer)
RETURNS public.game_rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.game_rooms; pname text;
BEGIN
  SELECT player_name INTO pname FROM public.room_players WHERE room_id = _room AND user_id = auth.uid();
  IF pname IS NULL THEN RAISE EXCEPTION 'Not in room'; END IF;
  UPDATE public.room_players SET finish_time_ms = coalesce(finish_time_ms, _time_ms)
  WHERE room_id = _room AND user_id = auth.uid();
  UPDATE public.game_rooms SET status = 'finished', winner_id = auth.uid(), winner_name = pname, winner_time_ms = _time_ms
  WHERE id = _room AND winner_id IS NULL AND status = 'playing';
  SELECT * INTO r FROM public.game_rooms WHERE id = _room;
  RETURN r;
END $$;

REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.create_room(text,text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.join_room(text,text,text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.start_room(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.finish_room(uuid,integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_room(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_room(uuid,integer) TO authenticated;

ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;