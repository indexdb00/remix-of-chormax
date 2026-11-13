import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  Search, Package, MessageSquare, Clapperboard, Grid3X3,
  Image as ImageIcon, Play, Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
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

export const Route = createFileRoute("/explorar")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Explorar — chromaX" },
      { name: "description", content: "Descubra fotos, vídeos, criadores e projetos digitais da comunidade ChromaX." },
      { property: "og:title", content: "Explorar — chromaX" },
      { property: "og:description", content: "Um espaço visual para descobrir posts, Reels e projetos da comunidade ChromaX." },
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
    <main className="min-h-screen bg-background p-10 text-destructive">
      <p className="font-mono text-sm">Não foi possível carregar o Explorar.</p>
      <p className="mt-2 text-xs text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
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
  const navigate = useNavigate({ from: "/explorar" });
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
    .sort((a, b) => b.t.localeCompare(a.t));

  const tabs = [
    { id: "tudo", label: "Para você", Icon: Sparkles },
    { id: "posts", label: "Posts", Icon: Grid3X3 },
    { id: "reels", label: "Reels", Icon: Clapperboard },
    { id: "produtos", label: "Projetos", Icon: Package },
  ] as const;

  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-3 pb-10 pt-7 sm:px-6 sm:pt-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.22em] text-accent">Descubra a comunidade</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              Explorar<span className="text-chrome">.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Ideias, projetos e pessoas que estão movimentando o universo digital.
            </p>
          </div>
          <span className="hidden items-center gap-2 border border-border px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
            <span className="h-1.5 w-1.5 bg-accent pixel-pulse" /> ChromaX Network
          </span>
        </div>

        <label className="flex items-center gap-3 border border-border bg-card/70 px-4 py-3 transition-colors focus-within:border-accent">
          <Search size={17} className="shrink-0 text-accent" />
          <input
            value={q}
            onChange={(event) => set({ q: event.target.value })}
            placeholder="Buscar posts, vídeos ou projetos..."
            aria-label="Buscar no Explorar"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && <button type="button" onClick={() => set({ q: "" })} className="font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground">Limpar</button>}
        </label>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-3" role="tablist" aria-label="Tipo de conteúdo">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => set({ tab: id })}
              className={`inline-flex shrink-0 items-center gap-2 border px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-accent hover:text-foreground"}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="mb-3 mt-5 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {tab === "reels" ? "Vídeos da comunidade" : tab === "posts" ? "Posts em fotos" : tab === "produtos" ? "Projetos digitais" : "Em destaque na rede"}
          </p>
          <span className="font-mono text-[10px] text-muted-foreground">{tiles.length} {tiles.length === 1 ? "item" : "itens"}</span>
        </div>

        {tiles.length > 0 ? (
          <div className={tab === "reels" ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4" : "grid grid-cols-3 gap-1 sm:gap-2"}>
            {tiles.map((tile, index) => {
              const tall = tab === "reels" || (tab === "tudo" && index % 11 === 4);
              const tileClass = `group relative block overflow-hidden border border-border/50 bg-card ${tall ? "aspect-[9/16]" : "aspect-square"}`;
              const media = tile.img ? (
                tile.video ? (
                  <video
                    src={tile.img}
                    muted
                    loop
                    playsInline
                    autoPlay={tab === "reels"}
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={tile.img}
                    alt={tile.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )
              ) : (
                <span className="flex h-full items-center justify-center bg-void">
                  <Package size={28} className="text-muted-foreground" />
                </span>
              );

              const overlay = (
                <>
                  {media}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10 opacity-80 transition-opacity group-hover:opacity-100" />
                  <span className="absolute right-2 top-2 border border-white/20 bg-black/50 p-1.5 text-white backdrop-blur">
                    {tile.kind === "product" ? <Package size={13} /> : tile.video ? <Play size={13} fill="currentColor" /> : <ImageIcon size={13} />}
                  </span>
                  <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-left text-[10px] font-semibold leading-4 text-white drop-shadow sm:inset-x-3 sm:bottom-3 sm:text-xs">
                    {tile.kind === "product" ? tile.title : tile.title}
                  </span>
                  {tile.kind === "product" && (
                    <span className="absolute bottom-2 right-2 bg-primary px-2 py-1 font-mono text-[9px] font-bold text-primary-foreground sm:bottom-3">
                      {formatPrice(tile.price)}
                    </span>
                  )}
                </>
              );

              return tile.kind === "product" ? (
                <Link key={tile.id} to="/produto/$slug" params={{ slug: tile.slug }} className={tileClass} aria-label={`Ver projeto ${tile.title}`}>
                  {overlay}
                </Link>
              ) : (
                <Link key={tile.id} to="/post/$id" params={{ id: tile.id }} className={tileClass} aria-label={`Abrir publicação: ${tile.title}`}>
                  {overlay}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-border px-6 text-center">
            <span className="mb-4 grid h-12 w-12 place-items-center border border-border bg-void text-accent">
              {tab === "reels" ? <Clapperboard size={21} /> : tab === "posts" ? <MessageSquare size={21} /> : <Search size={21} />}
            </span>
            <h2 className="font-display text-sm font-bold uppercase">
              {tab === "reels" ? "Ainda não há Reels" : "Nada por aqui ainda"}
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
              {tab === "reels"
                ? "Quando a comunidade publicar vídeos, eles vão aparecer nesta área."
                : "Tente outra busca ou volte mais tarde para descobrir novas publicações e projetos."}
            </p>
            {tab !== "tudo" && (
              <button type="button" onClick={() => set({ tab: "tudo", q: "" })} className="mt-5 border border-primary px-4 py-2 font-mono text-[10px] uppercase text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                Ver tudo
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
