CREATE TABLE public.post_ups (
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
GRANT SELECT ON public.post_ups TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_ups TO authenticated;
GRANT ALL ON public.post_ups TO service_role;
ALTER TABLE public.post_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ups read" ON public.post_ups FOR SELECT USING (true);
CREATE POLICY "ups insert own" ON public.post_ups FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ups delete own" ON public.post_ups FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.post_reposts (
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
GRANT SELECT ON public.post_reposts TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_reposts TO authenticated;
GRANT ALL ON public.post_reposts TO service_role;
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reposts read" ON public.post_reposts FOR SELECT USING (true);
CREATE POLICY "reposts insert own" ON public.post_reposts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.feed_posts f WHERE f.id = post_id AND f.author_id = auth.uid()));
CREATE POLICY "reposts delete own" ON public.post_reposts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX post_ups_post_idx ON public.post_ups(post_id);
CREATE INDEX post_reposts_post_idx ON public.post_reposts(post_id);

GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;