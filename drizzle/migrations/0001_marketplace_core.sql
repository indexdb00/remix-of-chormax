ALTER TABLE public.profiles
  ADD COLUMN logo_url text,
  ADD COLUMN banner_url text,
  ADD COLUMN banner_public boolean NOT NULL DEFAULT true,
  ADD COLUMN total_bought_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN total_sold_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN terms_accepted_at timestamptz,
  ADD COLUMN last_seen_at timestamptz;

CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- protect totals from user edits
CREATE OR REPLACE FUNCTION public.protect_profile_totals() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.total_bought_cents := OLD.total_bought_cents;
    NEW.total_sold_cents := OLD.total_sold_cents;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_protect_totals BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_totals();

ALTER TABLE public.products
  ADD COLUMN creator_id uuid,
  ADD COLUMN sale_mode text NOT NULL DEFAULT 'auto',
  ADD COLUMN images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN deliverable_type text NOT NULL DEFAULT 'text';
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
CREATE POLICY "products creator insert" ON public.products FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid() AND array_length(images,1) >= 3 AND sale_mode IN ('auto','chat'));
CREATE POLICY "products creator update" ON public.products FOR UPDATE TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "products creator delete" ON public.products FOR DELETE TO authenticated USING (creator_id = auth.uid());

CREATE TABLE public.product_deliverables (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  content text,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_deliverables TO authenticated;
GRANT ALL ON public.product_deliverables TO service_role;
ALTER TABLE public.product_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliverable creator all" ON public.product_deliverables FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX chats_unique ON public.chats (COALESCE(product_id,'00000000-0000-0000-0000-000000000000'::uuid), buyer_id, seller_id);
GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chats member read" ON public.chats FOR SELECT TO authenticated USING (auth.uid() IN (buyer_id, seller_id));
CREATE POLICY "chats member insert" ON public.chats FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (buyer_id, seller_id) AND buyer_id <> seller_id);
CREATE POLICY "chats member update" ON public.chats FOR UPDATE TO authenticated USING (auth.uid() IN (buyer_id, seller_id));

CREATE OR REPLACE FUNCTION public.is_chat_member(_chat uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chats WHERE id = _chat AND auth.uid() IN (buyer_id, seller_id))
$$;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'text',
  offer_cents integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_chat ON public.chat_messages (chat_id, created_at);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg member read" ON public.chat_messages FOR SELECT TO authenticated USING (public.is_chat_member(chat_id));
CREATE POLICY "msg member insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_chat_member(chat_id) AND kind IN ('text','offer'));

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friend read" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "friend request" ON public.friendships FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND status = 'pending' AND requester_id <> addressee_id);
CREATE POLICY "friend accept" ON public.friendships FOR UPDATE TO authenticated USING (addressee_id = auth.uid());
CREATE POLICY "friend remove" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, addressee_id));

CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'geral',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feed_posts TO anon;
GRANT SELECT, INSERT, DELETE ON public.feed_posts TO authenticated;
GRANT ALL ON public.feed_posts TO service_role;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed read" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "feed insert" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND char_length(body) BETWEEN 1 AND 500 AND kind IN ('geral','ajuda','pre-venda'));
CREATE POLICY "feed delete" ON public.feed_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text,
  button_label text NOT NULL DEFAULT 'Ver',
  button_link text NOT NULL DEFAULT '/',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann read" ON public.announcements FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ann admin write" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.announcement_dismissals (
  user_id uuid NOT NULL,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);
GRANT SELECT, INSERT, DELETE ON public.announcement_dismissals TO authenticated;
GRANT ALL ON public.announcement_dismissals TO service_role;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dismiss own" ON public.announcement_dismissals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "media read all" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "deliv own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliverables' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "deliv own read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deliverables' AND (storage.foldername(name))[1] = auth.uid()::text);