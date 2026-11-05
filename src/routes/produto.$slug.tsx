import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { PixelArt, seedOf } from "@/components/ProductCard";
import { formatPrice, productQuery, rarityClass } from "@/lib/products";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.name} — chromaX` : "Ativo indisponível — chromaX";
    const d = loaderData?.description ?? "Ativo digital no chromaX.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Produto,
  errorComponent: ({ error }) => <p className="p-10 font-mono text-destructive">{String((error as Error)?.message ?? error)}</p>,
  notFoundComponent: () => (
    <main className="min-h-screen p-10 text-center">
      <p className="font-display text-2xl">Ativo não encontrado</p>
      <Link to="/explorar" className="mt-4 inline-block font-mono text-accent">Voltar ao catálogo</Link>
    </main>
  ),
});

function Produto() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  if (!p) return null;
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <section className="px-5 py-8 md:px-12">
        <Link to="/explorar" className="inline-flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Catálogo
        </Link>
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="group border border-border bg-card p-5"><PixelArt seed={seedOf(p.slug)} big /></div>
          <div>
            <p className={`font-mono text-sm uppercase ${rarityClass[p.rarity] ?? ""}`}>■ {p.rarity} · {p.category}</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold uppercase md:text-5xl">{p.name}</h1>
            <p className="mt-6 text-muted-foreground">{p.description}</p>
            <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-6 font-mono text-sm">
              <div><dt className="text-xs text-accent">[ VENDEDOR ]</dt><dd className="mt-1">@{p.seller_name}</dd></div>
              <div><dt className="text-xs text-accent">[ VENDAS ]</dt><dd className="mt-1">{p.sales.toLocaleString("pt-BR")}</dd></div>
            </dl>
            <p className="mt-8 font-mono text-4xl font-bold text-chrome">{formatPrice(p.price_cents)}</p>
            <button
              onClick={() => toast("Compra em breve", { description: "A carteira e o checkout serão a próxima etapa." })}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-primary px-6 py-4 font-mono text-sm font-bold uppercase text-primary-foreground hover:bg-foreground md:w-auto"
            >
              <ShoppingCart size={16} /> Comprar agora
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
