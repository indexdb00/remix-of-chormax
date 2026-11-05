CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  rarity text NOT NULL,
  price_cents integer NOT NULL,
  description text NOT NULL DEFAULT '',
  seller_name text NOT NULL DEFAULT 'chromaX',
  sales integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);

INSERT INTO public.products (slug,name,category,rarity,price_cents,description,seller_name,sales) VALUES
('neonshader-pro','NeonShader Pro','Plugin','Lendário',28900,'Shaders neon em tempo real para Figma e Blender, com 120 presets.','pixelforge',412),
('dashboard-kit-x','Dashboard Kit X','Template','Épico',14900,'Kit de dashboard React com 60 telas e modo escuro.','uiwave',903),
('autodeploy-cli','AutoDeploy CLI','Software','Raro',9900,'Deploy com um comando para qualquer nuvem.','devops.br',1288),
('glyph-icons-3k','Glyph Icons 3K','Asset','Comum',3900,'3.000 ícones em SVG, traço e preenchido.','glyphlab',2210),
('voxel-world-pack','Voxel World Pack','Asset','Épico',7900,'Mais de 400 modelos voxel prontos para jogos.','cubehaus',356),
('landing-chrome','Landing Chrome','Template','Raro',5900,'Landing page cromada para lançamentos.','uiwave',611),
('ai-copy-plugin','AI Copy Plugin','Plugin','Lendário',19900,'Gere textos de interface direto no editor.','pixelforge',198),
('db-backup-pro','DB Backup Pro','Software','Comum',4900,'Backups automáticos agendados para Postgres.','devops.br',740);