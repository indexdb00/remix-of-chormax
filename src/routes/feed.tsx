import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useState } from "react";
import { z } from "zod";
import { Search, Package, SlidersHorizontal, X, Play, Image as ImageIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useCommunity } from "@/components/CommunityProvider";
import { productsQuery, formatPrice } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  q: fallback(z.string(), "").default(""),
});

const mediaPostsQuery = queryOptions({
  queryKey: ["explore-posts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("id,body,image_url,created_at")
      .eq("archived", false)
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
  | { kind: "post"; id: string; img: string | undefined; title: string; t: string; video: boolean };

const isVideo = (src: string | undefined) =>
  !!src && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src);

function Explorar() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: posts } = useSuspenseQuery(mediaPostsQuery);
  const { q } = Route.useSearch();
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
    img: post.image_url ?? undefined,
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

  return (
    <main className="min-h-screen bg-[#050505] pb-32 text-white">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-3 pb-10 pt-6 sm:px-6 sm:pt-8">
        <div className="relative">
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

        <div className="mb-3 mt-4 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">
            {"Descubra a comunidade"}
          </p>
          <span className="text-[10px] text-white/40">{tiles.length} {tiles.length === 1 ? "item" : "itens"}</span>
        </div>

        {tiles.length > 0 ? (
          <div className="grid grid-cols-3 gap-[2px] sm:gap-1.5">
            {tiles.map((tile) => {
              const media = tile.img ? (
                tile.video ? (
                  <span className="absolute inset-0">
                    <video src={tile.img} muted loop playsInline autoPlay preload="metadata"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><Play size={13} fill="currentColor" /></span>
                  </span>
                ) : (
                  <img src={tile.img} alt={tile.title} loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                )
              ) : tile.kind === "post" ? (
                <span className="flex h-full flex-col justify-between bg-gradient-to-br from-[#292929] via-[#111] to-[#050505] p-3 sm:p-4">
                  <span className="flex items-center gap-1.5 text-white/45"><ImageIcon size={13} /><span className="text-[8px] uppercase tracking-[.18em]">chromaX · post</span></span>
                  <span className="line-clamp-6 break-words text-xs font-semibold leading-relaxed text-white sm:text-sm">{tile.title}</span>
                </span>
              ) : (
                <span className="flex h-full items-center justify-center bg-[#151515]"><Package size={28} className="text-white/35" /></span>
              );
              const tileClass = "group relative block aspect-square overflow-hidden bg-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";
              const content = (
                <>
                  {media}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 opacity-70 transition group-hover:opacity-100" />
                  <span className="absolute right-2 top-2 text-white drop-shadow">
                    <span className="rounded-full border border-white/25 bg-black/60 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white/90">{tile.kind === "product" ? "Projeto" : tile.video ? "Reel" : "Post"}</span>
                  </span>
                  <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1">
                    <span className="line-clamp-2 min-w-0 flex-1 text-[10px] font-medium leading-4 text-white drop-shadow sm:text-xs">{tile.title}</span>
                    {tile.kind === "product" && <span className="shrink-0 rounded-full border border-white/35 bg-black/75 px-1.5 py-1 text-[8px] font-semibold text-white backdrop-blur sm:px-2 sm:text-[9px]">{formatPrice(tile.price)}</span>}
                  </span>
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
            <span className="mb-3 text-[10px] uppercase tracking-[.22em] text-white/35">ChromaX</span>
            <h2 className="text-sm font-semibold text-white">{"Nada por aqui ainda"}</h2>
            <p className="mt-2 max-w-sm text-xs leading-6 text-white/50">
              {"Fotos, vídeos, publicações e projetos da comunidade vão aparecer nesta grade."}
            </p>
            {q && <button type="button" onClick={() => set({ q: "" })} className="mt-5 rounded-full border border-white/50 px-5 py-2 text-xs text-white transition hover:bg-white hover:text-black">Limpar pesquisa</button>}
          </div>
        )}
      </section>
    </main>
  );
}
