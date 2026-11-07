import { SaveButton } from "./SaveButton";
import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/products";

const pixelRow = (seed: number, n = 64) =>
  Array.from({ length: n }, (_, i) => ((i * 7 + seed * 13) % 11) < 5);

export function PixelArt({ seed, big = false }: { seed: number; big?: boolean }) {
  return (
    <div className={`grid aspect-square ${big ? "grid-cols-12" : "grid-cols-8"} bg-secondary`}>
      {pixelRow(seed, big ? 144 : 64).map((on, k) => (
        <div key={k} className={on && k % 3 ? "bg-primary/20 group-hover:bg-primary/40" : ""} />
      ))}
    </div>
  );
}

export const seedOf = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 50;

type P = { id?: string; slug: string; name: string; category: string; price_cents: number; images?: string[] | null };

export function ProductCard({ p }: { p: P }) {
  const img = p.images?.[0];
  return (
    <article className="relative">
    <Link to="/produto/$slug" params={{ slug: p.slug }} className="group block border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary">
      {img ? <img src={img} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" /> : <PixelArt seed={seedOf(p.slug)} />}
      <h3 className="mt-4 font-display text-base font-extrabold">{p.name}</h3>
      <div className="mt-3 flex items-center justify-between font-mono text-sm">
        <span className="text-muted-foreground">{p.category}</span>
        <span className="font-bold">{formatPrice(p.price_cents)}</span>
      </div>
    </Link>
    {p.id && <div className="absolute right-6 top-6 rounded-full bg-background/90"><SaveButton productId={p.id} /></div>}
    </article>
  );
}
