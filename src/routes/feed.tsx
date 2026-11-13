import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useState } from "react";
import { z } from "zod";
import {
  Search, Package, Clapperboard, Grid3X3, Image as ImageIcon, Play,
  Plus, SlidersHorizontal, Sparkles, Code2, Users, Layers3, X,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useCommunity } from "@/components/CommunityProvider";
import { productsQuery, formatPrice } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  q: fallback(z.string(), "").default(""),
  tab: fallback(z.enum(["tudo", "posts", "reels", "produtos"]), "tudo").default("tudo"),
});

const mediaPostsQuery = queryOptions({
  queryKey: ["explore-posts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("id,body,image_url,created_at")
      .eq("archived", false)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/feed")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Explorar — chromaX" },
      { name: "description", content: "Descubra posts, Reels, criadores e projetos digitais da comunidade ChromaX." },
      { property: "og:title", content: "Explorar — chromaX" },
      { property: "og:description", content: "Descubra conteúdos e projetos da comunidade ChromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(mediaPostsQuery),
    ]),
  component: Explorar,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-black p-10 text-white">
      <p className="font-mono text-sm">Não foi possível carregar o Explorar.</p>
      <p className="mt-2 text-xs text-white/50">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

type Tile =
  | { kind: "product"; id: string; img: string | undefined; title: string; slug: string; price: number; t: string; video: false }
  | { kind: "post"; id: string; img: string; title: string; t: string; video: boolean };

const isVideo = (src: string | undefined) =>
  !!src && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src);

function Explorar() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: posts } = useSuspenseQuery(mediaPostsQuery);
  const { q, tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/feed" });
  const { compose } = useCommunity();
  const [showFilters, setShowFilters] = useState(false);
  const [oldestFirst, setOldestFirst] = useState(false);
  const set = (patch: Partial<z.infer<typeof schema>>) =>
    navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true });
  const term = q.trim().toLocaleLowerCase("pt-BR");

  const postTiles: Tile[] = posts.map((post) => ({
    kind: "post",
    id: post.id,
    img: post.image_url!,
    title: post.body || "Publicação da comunidade",
    t: post.created_at,
    video: isVideo(post.image_url),
  }));
  const productTiles: Tile[] = products.map((product) => ({
    kind: "product",
    id: product.id,
    img: product.images?.[0],
    title: product.name,
    slug: product.slug,
    price: product.price_cents,
    t: product.created_at,
    video: false,
  }));

  let tiles: Tile[] = [];
  if (tab === "tudo") tiles = [...productTiles, ...postTiles];
  if (tab === "posts") tiles = postTiles.filter((tile) => !tile.video);
  if (tab === "reels") tiles = postTiles.filter((tile) => tile.video);
  if (tab === "produtos") tiles = productTiles;
  tiles = tiles
    .filter((tile) => tile.title.toLocaleLowerCase("pt-BR").includes(term))
    .sort((a, b) => oldestFirst ? a.t.localeCompare(b.t) : b.t.localeCompare(a.t));

  const tabs = [
    { id: "tudo", label: "Para você", Icon: Sparkles },
    { id: "posts", label: "Posts", Icon: Grid3X3 },
    { id: "reels", label: "Reels", Icon: Clapperboard },
    { id: "produtos", label: "Projetos", Icon: Package },
  ] as const;

  const shortcuts = [
    { label: "Criar", Icon: Plus, action: () => compose() },
    { label: "Projetos", Icon: Layers3, action: () => set({ tab: "produtos" }) },
    { label: "Dev", Icon: Code2, action: () => set({ tab: "posts" }) },
    { label: "Reels", Icon: Clapperboard, action: () => set({ tab: "reels" }) },
    { label: "Posts", Icon: ImageIcon, action: () => set({ tab: "posts" }) },
    { label: "Comunidade", Icon: Users, action: () => set({ tab: "tudo" }) },
  ];

  return (
    <main className="min-h-screen bg-[#050505] pb-32 text-white">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-3 pb-10 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-4 flex justify-end">\n          <button type="button" onClick={compose} aria-label="Criar publicação" title="Criar publicação" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 text-white transition hover:border-white hover:bg-white hover:text-black"><Plus size={21} /></button>\n        </div>\n\n        <div className="relative">
          <label className="flex h-12 items-center gap-3 rounded-full border border-white/25 bg-white/[0.045] px-4 transition focus-within:border-white/70">
            <Search size={19} className="shrink-0 text-white/75" />
            <input value={q} onChange={(event) => set({ q: event.target.value })}
              placeholder="Pesquisar no ChromaX..." aria-label="Pesquisar no Explorar"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45" />
            {q && <button type="button" onClick={() => set({ q: "" })} aria-label="Limpar pesquisa" className="text-white/60 hover:text-white"><X size={17} /></button>}
            <span className="h-6 w-px bg-white/15" />
            <button type="button" onClick={() => setShowFilters((value) => !value)}
              aria-label="Abrir filtros" aria-expanded={showFilters}
              className={`rounded-full p-1.5 transition hover:bg-white/10 ${showFilters ? "text-white" : "text-white/70"}`}>
              <SlidersHorizontal size={19} />
            </button>
          </label>
          {showFilters && (
            <div className="absolute right-0 top-14 z-20 min-w-48 rounded-2xl border border-white/20 bg-[#111] p-2 shadow-2xl">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">Ordenar publicações</p>
              <button type="button" onClick={() => { setOldestFirst(false); setShowFilters(false); }}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10 ${!oldestFirst ? "text-white" : "text-white/60"}`}>Mais recentes</button>
              <button type="button" onClick={() => { setOldestFirst(true); setShowFilters(false); }}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10 ${oldestFirst ? "text-white" : "text-white/60"}`}>Mais antigas</button>
            </div>
          )}
        </div>

        <div className="scrollbar-none -mx-3 mt-6 flex gap-5 overflow-x-auto px-3 pb-2 sm:mx-0 sm:gap-7 sm:px-1" aria-label="Atalhos de descoberta">
          {shortcuts.map(({ label, Icon, action }) => (
            <button key={label} type="button" onClick={action} className="group flex min-w-[66px] shrink-0 flex-col items-center gap-2">
              <span className="grid h-[66px] w-[66px] place-items-center rounded-full border border-white/65 bg-gradient-to-br from-white/15 via-white/[0.04] to-black p-[2px] transition group-hover:border-white group-hover:shadow-[0_0_18px_rgba(255,255,255,.18)]">
                <span className="grid h-full w-full place-items-center rounded-full bg-[#090909] text-white"><Icon size={25} strokeWidth={1.65} /></span>
              </span>
              <span className="text-xs text-white/85">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-4 border-y border-white/15" role="tablist" aria-label="Tipo de conteúdo">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => set({ tab: id })}
              className={`flex min-h-12 items-center justify-center gap-2 border-b-2 px-1 py-3 text-[11px] font-semibold transition sm:text-sm ${tab === id ? "border-white text-white" : "border-transparent text-white/45 hover:text-white/80"}`}>
              <Icon size={15} /> <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mb-3 mt-4 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">
            {tab === "reels" ? "Reels da comunidade" : tab === "posts" ? "Publicações" : tab === "produtos" ? "Projetos digitais" : "Descobertas para você"}
          </p>
          <span className="text-[10px] text-white/40">{tiles.length} {tiles.length === 1 ? "item" : "itens"}</span>
        </div>

        {tiles.length > 0 ? (
          <div className="grid grid-cols-3 gap-[2px] sm:gap-1.5">
            {tiles.map((tile) => {
              const media = tile.img ? (
                tile.video ? (
                  <video src={tile.img} muted loop playsInline autoPlay={tab === "reels"} preload="metadata"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <img src={tile.img} alt={tile.title} loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                )
              ) : (
                <span className="flex h-full items-center justify-center bg-[#151515]"><Package size={28} className="text-white/35" /></span>
              );
              const tileClass = "group relative block aspect-square overflow-hidden bg-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";
              const content = (
                <>
                  {media}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 opacity-70 transition group-hover:opacity-100" />
                  <span className="absolute right-2 top-2 text-white drop-shadow">
                    {tile.kind === "product" ? <Package size={17} /> : tile.video ? <Play size={17} fill="white" /> : <ImageIcon size={17} />}
                  </span>
                  <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-[10px] font-medium leading-4 text-white drop-shadow sm:text-xs">{tile.title}</span>
                  {tile.kind === "product" && <span className="absolute bottom-2 right-2 rounded-full border border-white/50 bg-black/70 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur">{formatPrice(tile.price)}</span>}
                </>
              );
              return tile.kind === "product" ? (
                <Link key={tile.id} to="/produto/$slug" params={{ slug: tile.slug }} className={tileClass} aria-label={`Ver projeto ${tile.title}`}>{content}</Link>
              ) : (
                <Link key={tile.id} to="/post/$id" params={{ id: tile.id }} className={tileClass} aria-label={`Abrir publicação: ${tile.title}`}>{content}</Link>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/[0.04] text-white/70">
              {tab === "reels" ? <Clapperboard size={23} /> : tab === "posts" ? <Grid3X3 size={23} /> : <Search size={23} />}
            </span>
            <h2 className="text-sm font-semibold text-white">{tab === "reels" ? "Ainda não há Reels" : "Nada encontrado"}</h2>
            <p className="mt-2 max-w-sm text-xs leading-6 text-white/50">
              {tab === "reels" ? "Os vídeos publicados pela comunidade vão aparecer aqui." : "Tente outra pesquisa ou volte mais tarde para descobrir novos conteúdos."}
            </p>
            {(tab !== "tudo" || q) && <button type="button" onClick={() => set({ tab: "tudo", q: "" })} className="mt-5 rounded-full border border-white/50 px-5 py-2 text-xs text-white transition hover:bg-white hover:text-black">Ver tudo</button>}
          </div>
        )}
      </section>
    </main>
  );
}
