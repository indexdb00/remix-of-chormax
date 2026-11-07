ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS image_url text;
GRANT SELECT ON public.feed_posts, public.profiles, public.products TO anon;
GRANT SELECT, INSERT, DELETE ON public.feed_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
CREATE TABLE public.saved_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 post_id uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
 product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT saved_item_one_target CHECK ((post_id IS NOT NULL)::integer + (product_id IS NOT NULL)::integer = 1),
 UNIQUE(user_id, post_id),
 UNIQUE(user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_items TO authenticated;
GRANT ALL ON public.saved_items TO service_role;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved own read" ON public.saved_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "saved own insert" ON public.saved_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved own delete" ON public.saved_items FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX feed_posts_author_date ON public.feed_posts(author_id, created_at DESC);
CREATE INDEX saved_items_user_date ON public.saved_items(user_id, created_at DESC);
COMMENT ON COLUMN public.products.rarity IS 'DEPRECATED: retained for backwards compatibility; not displayed or selected in the user interface.';