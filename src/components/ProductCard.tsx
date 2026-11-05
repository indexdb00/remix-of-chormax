import { Link } from "@tanstack/react-router";
import { formatPrice, rarityClass } from "@/lib/products";

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

type P = { slug: string; name: string; category: string; rarity: string; price_cents: number };

export function ProductCard({ p }: { p: P }) {
  return (
    <Link to="/produto/$slug" params={{ slug: p.slug }} className="group block border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary">
      <PixelArt seed={seedOf(p.slug)} />
      <p className={`mt-4 font-mono text-xs uppercase ${rarityClass[p.rarity] ?? ""}`}>■ {p.rarity}</p>
      <h3 className="mt-1 font-display text-base font-extrabold">{p.name}</h3>
      <div className="mt-3 flex items-center justify-between font-mono text-sm">
        <span className="text-muted-foreground">{p.category}</span>
        <span className="font-bold">{formatPrice(p.price_cents)}</span>
      </div>
    </Link>
  );
}
