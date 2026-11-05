import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowDownRight, Zap } from "lucide-react";
import voxel from "@/assets/voxel-chrome.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "chromaX — Marketplace P2P de ativos digitais" },
      { name: "description", content: "Compre, venda e revenda plugins, templates e softwares em um mercado P2P gamificado." },
      { property: "og:title", content: "chromaX — Marketplace P2P de ativos digitais" },
      { property: "og:description", content: "Plugins, templates e softwares com raridade, inventário e revenda P2P." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// deterministic pixel rows
const pixelRow = (seed: number, n = 40) =>
  Array.from({ length: n }, (_, i) => ((i * 7 + seed * 13) % 11) < 5);

function PixelBand({ seed, tone = "bg-primary" }: { seed: number; tone?: string }) {
  return (
    <div aria-hidden className="w-full overflow-hidden">
      {[0, 1, 2].map((r) => (
        <div key={r} className="grid grid-cols-[repeat(40,1fr)]">
          {pixelRow(seed + r).map((on, i) => (
            <div key={i} className={`aspect-square ${on && (r === 0 || i % (r + 2)) ? tone : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

const items = [
  { name: "NeonShader Pro", cat: "Plugin", price: "R$ 289", rarity: "Lendário", cls: "text-legendary" },
  { name: "Dashboard Kit X", cat: "Template", price: "R$ 149", rarity: "Épico", cls: "text-epic" },
  { name: "AutoDeploy CLI", cat: "Software", price: "R$ 99", rarity: "Raro", cls: "text-rare" },
  { name: "Glyph Icons 3K", cat: "Asset", price: "R$ 39", rarity: "Comum", cls: "text-muted-foreground" },
];

function Index() {
  const [vol, setVol] = useState(1482930);
  useEffect(() => {
    const t = setInterval(() => setVol((v) => v + Math.floor(Math.random() * 400)), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <header className="flex items-center justify-between px-5 py-5 md:px-12">
        <span className="font-display text-xl font-extrabold">chroma<span className="text-chrome">X</span></span>
        <a href="#" className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground">
          Entrar <ArrowRight size={14} />
        </a>
      </header>

      <PixelBand seed={1} />

      <section className="grid gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:px-12">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 font-mono text-xs text-accent">
            <span className="h-2 w-2 bg-accent pixel-pulse" /> MERCADO AO VIVO
          </p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[1.05] md:text-6xl">
            Seu código<br /><span className="text-chrome">vale ouro</span>
          </h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            Compre, colecione e revenda plugins, templates e softwares. Cada ativo tem raridade — e mercado.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#vitrine" className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground hover:bg-foreground">
              Explorar <ArrowDownRight size={16} />
            </a>
            <a href="#" className="inline-flex items-center gap-2 border border-border px-6 py-3 font-mono text-sm uppercase hover:border-primary">
              Vender ativo
            </a>
          </div>
        </div>
        <img src={voxel} alt="Troféu e disquete em voxels cromados" width={1024} height={1024} className="mx-auto w-full max-w-md" />
      </section>

      <section className="grid gap-8 bg-fade px-5 py-14 md:grid-cols-3 md:px-12">
        {[
          ["01", "Volume negociado", `R$ ${vol.toLocaleString("pt-BR")},00`],
          ["02", "Transações", "38.214"],
          ["03", "Devs ativos", "6.902"],
        ].map(([n, l, v]) => (
          <div key={n}>
            <p className="font-mono text-sm text-accent">[ {n} ]</p>
            <p className="mt-3 font-display text-sm font-extrabold uppercase">{l}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-chrome md:text-3xl">{v}</p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden border-y border-border bg-void py-3">
        <div className="marquee flex w-max gap-10 font-mono text-xs uppercase text-muted-foreground">
          {[...items, ...items, ...items, ...items].map((it, i) => (
            <span key={i} className="flex items-center gap-2"><Zap size={12} className="text-accent" />Alguém comprou {it.name} · <span className={it.cls}>{it.rarity}</span></span>
          ))}
        </div>
      </div>

      <section id="vitrine" className="bg-void px-5 py-16 md:px-12">
        <h2 className="font-display text-3xl font-extrabold uppercase md:text-5xl">
          Lendários<br /><span className="text-chrome">da semana</span>
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <article key={it.name} className="group border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary">
              <div className="grid aspect-square grid-cols-8 bg-secondary">
                {pixelRow(i * 3, 64).map((on, k) => (
                  <div key={k} className={on && k % 3 ? "bg-primary/20 group-hover:bg-primary/40" : ""} />
                ))}
              </div>
              <p className={`mt-4 font-mono text-xs uppercase ${it.cls}`}>■ {it.rarity}</p>
              <h3 className="mt-1 font-display text-base font-extrabold">{it.name}</h3>
              <div className="mt-3 flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">{it.cat}</span>
                <span className="font-bold">{it.price}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="bg-void"><PixelBand seed={4} tone="bg-secondary" /></div>

      <section className="px-5 py-20 text-center md:px-12">
        <h2 className="font-display text-3xl font-extrabold uppercase md:text-5xl">Comece a <span className="text-chrome">negociar</span></h2>
        <a href="#" className="mt-8 inline-flex items-center gap-2 bg-primary px-8 py-4 font-mono text-sm font-bold uppercase text-primary-foreground hover:bg-foreground">
          Criar conta grátis <ArrowRight size={16} />
        </a>
      </section>
    </main>
  );
}
