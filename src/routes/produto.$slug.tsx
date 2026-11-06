import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { BumpPayLogo } from "@/components/BumpPayLogo";
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
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState(0);
  if (!p) return null;
  return (
    <main className="min-h-screen bg-background pb-24 font-sans text-foreground">
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <BumpPayLogo />
              <button aria-label="Fechar" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <p className="mt-6 font-mono text-xs uppercase text-muted-foreground">Checkout seguro</p>
            <p className="mt-1 font-display text-lg font-extrabold">{p.name}</p>
            <p className="mt-2 font-mono text-3xl font-bold">{formatPrice(p.price_cents)}</p>
            <div className="mt-6 grid grid-cols-2 gap-2 font-mono text-xs uppercase">
              <div className="border border-border p-3 text-center text-muted-foreground">Pix</div>
              <div className="border border-border p-3 text-center text-muted-foreground">Cartão</div>
            </div>
            <button disabled className="mt-4 w-full bg-primary px-6 py-4 font-mono text-sm font-bold uppercase text-primary-foreground opacity-60">
              Disponível em Janeiro
            </button>
            <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">Estamos em pré-lançamento. As compras abrem em janeiro.</p>
          </div>
        </div>
      )}
      <SiteHeader />
      <section className="px-5 py-8 md:px-12">
        <Link to="/explorar" className="inline-flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Catálogo
        </Link>
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="group border border-border bg-card p-5">
            {p.images?.length ? (
              <>
                <img src={p.images[img] ?? p.images[0]} alt={p.name} className="aspect-square w-full object-cover" />
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {p.images.map((u, i) => (
                    <button key={u} onClick={() => setImg(i)} className={`h-16 w-16 shrink-0 border ${i === img ? "border-primary" : "border-border"}`}>
                      <img src={u} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            ) : <PixelArt seed={seedOf(p.slug)} big />}
          </div>
          <div>
            <p className={`font-mono text-sm uppercase ${rarityClass[p.rarity] ?? ""}`}>■ {p.rarity} · {p.category}</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold uppercase md:text-5xl">{p.name}</h1>
            <p className="mt-6 text-muted-foreground">{p.description}</p>
            <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-6 font-mono text-sm">
              <div><dt className="text-xs text-accent">[ VENDEDOR ]</dt><dd className="mt-1">@{p.seller_name}</dd></div>
              <div><dt className="text-xs text-accent">[ VENDAS ]</dt><dd className="mt-1">{p.sales.toLocaleString("pt-BR")}</dd></div>
            </dl>
            <p className="mt-8 font-mono text-4xl font-bold text-chrome">{formatPrice(p.price_cents)}</p>
            <p className="mt-3 inline-block border border-accent px-3 py-1 font-mono text-xs uppercase text-accent">
              Pré-lançamento — Janeiro
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {p.sale_mode === "chat" ? "Venda pelo chat: negocie o preço com o vendedor." : "Entrega automática após a compra."}
            </p>
            <button
              onClick={() => setOpen(true)}
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
