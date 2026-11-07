import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, Package, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { productsQuery, formatPrice } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  q: fallback(z.string(), "").default(""),
  tab: fallback(z.enum(["tudo", "produtos", "posts"]), "tudo").default("tudo"),
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
      .limit(60);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/explorar")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Explorar — chromaX" },
      { name: "description", content: "Descubra produtos digitais e posts da comunidade em mosaico." },
      { property: "og:title", content: "Explorar — chromaX" },
      { property: "og:description", content: "Mosaico de produtos e posts da comunidade chromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(productsQuery), context.queryClient.ensureQueryData(mediaPostsQuery)]),
  component: Explorar,
  errorComponent: ({ error }) => <p className="p-10 font-mono text-destructive">{String((error as Error)?.message ?? error)}</p>,
});

type Tile =
  | { kind: "product"; id: string; img: string | undefined; title: string; slug: string; price: number; t: string }
  | { kind: "post"; id: string; img: string; title: string; t: string };

function Explorar() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: posts } = useSuspenseQuery(mediaPostsQuery);
  const { q, tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/explorar" });
  const set = (patch: Partial<z.infer<typeof schema>>) => navigate({ search: (p) => ({ ...p, ...patch }), replace: true });
  const term = q.toLowerCase();

  let tiles: Tile[] = [];
  if (tab !== "posts")
    tiles.push(...products.map((p) => ({ kind: "product" as const, id: p.id, img: p.images?.[0], title: p.name, slug: p.slug, price: p.price_cents, t: p.created_at })));
  if (tab !== "produtos")
    tiles.push(...posts.map((p) => ({ kind: "post" as const, id: p.id, img: p.image_url!, title: p.body, t: p.created_at })));
  tiles = tiles.filter((x) => x.title.toLowerCase().includes(term)).sort((a, b) => b.t.localeCompare(a.t));

  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-3 pt-4 sm:px-5">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Search size={16} className="text-muted-foreground" />
          <input value={q} onChange={(e) => set({ q: e.target.value })} placeholder="Pesquisar" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <div className="mt-3 flex gap-2">
          {(["tudo", "produtos", "posts"] as const).map((t) => (
            <button key={t} onClick={() => set({ tab: t })} className={`rounded-full border px-4 py-1.5 text-xs capitalize ${tab === t ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>{t}</button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-0.5 sm:gap-1">
          {tiles.map((x, i) => {
            const big = i % 10 === 2 || i % 10 === 5;
            const cls = `group relative block overflow-hidden bg-card ${big ? "row-span-2 aspect-[1/2]" : "aspect-square"}`;
            const inner = (
              <>
                {x.img ? (
                  /\.(mp4|webm|mov)$/i.test(x.img) ? (
                    <video src={x.img} muted loop playsInline autoPlay className="h-full w-full object-cover" />
                  ) : (
                    <img src={x.img} alt={x.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )
                ) : (
                  <span className="flex h-full items-center justify-center"><Package className="text-muted-foreground" /></span>
                )}
                <span className="absolute right-1.5 top-1.5 rounded-full bg-background/70 p-1 backdrop-blur">
                  {x.kind === "product" ? <Package size={12} /> : <MessageSquare size={12} />}
                </span>
                {x.kind === "product" && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-background/75 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">{formatPrice(x.price)}</span>
                )}
              </>
            );
            return x.kind === "product" ? (
              <Link key={x.id} to="/produto/$slug" params={{ slug: x.slug }} className={cls}>{inner}</Link>
            ) : (
              <Link key={x.id} to="/post/$id" params={{ id: x.id }} className={cls}>{inner}</Link>
            );
          })}
        </div>
        {tiles.length === 0 && <p className="mt-10 text-center text-sm text-muted-foreground">Nada encontrado.</p>}
      </section>
    </main>
  );
}
