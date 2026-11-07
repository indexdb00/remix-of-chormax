import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { productsQuery } from "@/lib/products";

const schema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "Todos").default("Todos"),
  sort: fallback(z.string(), "populares").default("populares"),
});

export const Route = createFileRoute("/explorar")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Explorar ativos — chromaX" },
      { name: "description", content: "Busque plugins, templates, softwares e assets por categoria." },
      { property: "og:title", content: "Explorar ativos — chromaX" },
      { property: "og:description", content: "Catálogo completo do marketplace chromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Explorar,
  errorComponent: ({ error }) => <p className="p-10 font-mono text-destructive">{String((error as Error)?.message ?? error)}</p>,
  notFoundComponent: () => <p className="p-10">Nada encontrado.</p>,
});

const CATS = ["Todos", "Plugin", "Template", "Software", "Asset", "Conta de jogo", "Código"];

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className={`border px-3 py-1.5 font-mono text-xs uppercase ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
      {children}
    </Button>
  );
}

function Explorar() {
  const { data } = useSuspenseQuery(productsQuery);
  const { q, cat, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/explorar" });
  const set = (patch: Partial<z.infer<typeof schema>>) => navigate({ search: (p) => ({ ...p, ...patch }), replace: true });

  let list = data.filter(
    (p) =>
      (cat === "Todos" || p.category === cat) &&
      p.name.toLowerCase().includes(q.toLowerCase()),
  );
  if (sort === "menor") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
  if (sort === "maior") list = [...list].sort((a, b) => b.price_cents - a.price_cents);

  return (
    <main className="min-h-screen bg-background pb-32 font-sans text-foreground">
      <SiteHeader />
      <section className="px-5 py-10 md:px-12">
        <p className="font-mono text-sm text-accent">[ CATÁLOGO ]</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase md:text-5xl">Explorar <span className="text-chrome">ativos</span></h1>

        <label className="mt-8 flex items-center gap-3 border border-border bg-card px-4 py-3">
          <Search size={16} className="text-muted-foreground" />
          <input value={q} onChange={(e) => set({ q: e.target.value })} placeholder="Buscar por nome..." className="w-full bg-transparent font-mono text-sm outline-none" />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">{CATS.map((c) => <Chip key={c} on={cat === c} onClick={() => set({ cat: c })}>{c}</Chip>)}</div>

        <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase text-muted-foreground">
          <span>{list.length} ativos</span>
          <select value={sort} onChange={(e) => set({ sort: e.target.value })} className="border border-border bg-card px-2 py-1 text-foreground">
            <option value="populares">Mais vendidos</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        {list.length === 0 && <p className="mt-10 font-mono text-sm text-muted-foreground">Nenhum ativo com esses filtros.</p>}
      </section>
    </main>
  );
}
