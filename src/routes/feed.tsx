import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useState } from "react";
import { z } from "zod";
import { Search, SlidersHorizontal, X, Play, Image as ImageIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({ q: fallback(z.string(), "").default("") });
const mediaPostsQuery = queryOptions({
  queryKey: ["explore-posts"],
  queryFn: async () => {
    const { data, error } = await supabase.from("feed_posts").select("id,body,image_url,created_at")
      .eq("archived", false).order("created_at", { ascending: false }).limit(80);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/feed")({
  validateSearch: zodValidator(schema),
  head: () => ({ meta: [
    { title: "Explorar — chromaX" },
    { name: "description", content: "Pesquise publicações, fotos e vídeos da comunidade ChromaX." },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(mediaPostsQuery),
  component: Explorar,
});

const isVideo = (src: string | undefined) => !!src && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src);

function Explorar() {
  const { data: posts } = useSuspenseQuery(mediaPostsQuery);
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/feed" });
  const [showFilters, setShowFilters] = useState(false);
  const [oldestFirst, setOldestFirst] = useState(false);
  const set = (patch: Partial<z.infer<typeof schema>>) =>
    navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true });
  const term = q.trim().toLocaleLowerCase("pt-BR");
  const tiles = posts.map((post) => ({
    id: post.id, img: post.image_url ?? undefined,
    title: post.body || "Publicação da comunidade", t: post.created_at,
    video: isVideo(post.image_url ?? undefined),
  })).filter((tile) => tile.title.toLocaleLowerCase("pt-BR").includes(term))
    .sort((a, b) => oldestFirst ? a.t.localeCompare(b.t) : b.t.localeCompare(a.t));

  return (
    <main className="min-h-screen bg-[#050505] pb-32 text-white">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-3 pb-10 pt-5 sm:px-6 sm:pt-7">
        <div className="relative">
          <label className="flex h-11 items-center gap-3 rounded-full bg-white/[0.06] px-4 transition focus-within:bg-white/[0.09]">
            <Search size={18} className="shrink-0 text-white/75" />
            <input value={q} onChange={(event) => set({ q: event.target.value })} placeholder="Pesquisar publicações..." aria-label="Pesquisar publicações" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
            {q && <button type="button" onClick={() => set({ q: "" })} aria-label="Limpar pesquisa" className="text-white/60 hover:text-white"><X size={17} /></button>}
            <button type="button" onClick={() => setShowFilters((value) => !value)} aria-label="Ordenar publicações" aria-expanded={showFilters} className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10"><SlidersHorizontal size={18} /></button>
          </label>
          {showFilters && <div className="absolute right-0 top-12 z-20 min-w-44 rounded-xl bg-[#171717] p-2 shadow-2xl">
            <button type="button" onClick={() => { setOldestFirst(false); setShowFilters(false); }} className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/10">Mais recentes</button>
            <button type="button" onClick={() => { setOldestFirst(true); setShowFilters(false); }} className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/10">Mais antigas</button>
          </div>}
        </div>
        <div className="mb-3 mt-4 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">Publicações</p>
          <span className="text-[10px] text-white/40">{tiles.length} {tiles.length === 1 ? "post" : "posts"}</span>
        </div>
        {tiles.length ? <div className="grid grid-cols-3 gap-[2px] sm:gap-1.5">
          {tiles.map((tile) => {
            const media = tile.img ? (tile.video
              ? <span className="absolute inset-0"><video src={tile.img} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><Play size={13} fill="currentColor" /></span></span>
              : <img src={tile.img} alt={tile.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />)
              : <span className="flex h-full flex-col justify-between bg-gradient-to-br from-[#292929] via-[#111] to-[#050505] p-3 sm:p-4"><span className="flex items-center gap-1.5 text-white/45"><ImagePlusFallback /><span className="text-[8px] uppercase tracking-[.18em]">post</span></span><span className="line-clamp-6 break-words text-xs font-semibold leading-relaxed text-white sm:text-sm">{tile.title}</span></span>;
            return <Link key={tile.id} to="/post/$id" params={{ id: tile.id }} aria-label={"Abrir publicação: " + tile.title} className="group relative block aspect-square overflow-hidden bg-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              {media}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 opacity-70 transition group-hover:opacity-100" />
              <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white/90">{tile.video ? "Reel" : "Post"}</span>
              <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-[10px] font-medium leading-4 text-white drop-shadow sm:text-xs">{tile.title}</span>
            </Link>;
          })}
        </div> : <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <h2 className="text-sm font-semibold text-white">Nada por aqui ainda</h2>
          <p className="mt-2 max-w-sm text-xs leading-6 text-white/50">As publicações da comunidade aparecerão aqui.</p>
          {q && <button type="button" onClick={() => set({ q: "" })} className="mt-5 rounded-full bg-white px-5 py-2 text-xs text-black">Limpar pesquisa</button>}
        </div>}
      </section>
    </main>
  );
}

function ImagePlusFallback() {
  return <span className="text-[10px]">▧</span>;
}
