import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowBigUp, Repeat2, MessageCircle, ShieldCheck, Image as ImageIcon, Users, Search, Package } from "lucide-react";
import voxel from "@/assets/voxel-chrome.jpg";
import network from "@/assets/voxel-network.jpg";
import media from "@/assets/voxel-media.jpg";

const pixelRow = (seed: number, n = 40) => Array.from({ length: n }, (_, i) => ((i * 7 + seed * 13) % 11) < 5);
function PixelBand({ seed }: { seed: number }) {
  return <div aria-hidden className="w-full overflow-hidden">{[0, 1, 2].map((r) => <div key={r} className="grid grid-cols-[repeat(40,1fr)]">{pixelRow(seed + r).map((on, i) => <div key={i} className={`aspect-square ${on && (r === 0 || i % (r + 2)) ? "bg-primary" : ""}`} />)}</div>)}</div>;
}

const pillars = [
  { n: "01", t: "Networking", d: "Siga pessoas, adicione amigos e veja no Início só quem faz parte da sua roda.", I: Users },
  { n: "02", t: "Mídia", d: "Posts com fotos, Ups, reposts e um Explorar em mosaico para descobrir criadores.", I: ImageIcon },
  { n: "03", t: "Chat", d: "Converse com amigos e negocie compras e vendas no mesmo lugar, separados por tipo.", I: MessageCircle },
  { n: "04", t: "Creator", d: "Publique itens digitais gamers com entrega automática ou negociação pelo chat.", I: Package },
];

export function Landing() {
  return (
    <main className="min-h-screen bg-background pb-32 font-sans text-foreground">
      <header className="flex items-center justify-between px-5 py-5 md:px-12">
        <span className="font-display text-xl font-extrabold">chroma<span className="text-chrome">X</span></span>
        <Link to="/auth" className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground">Entrar <ArrowRight size={14} /></Link>
      </header>
      <PixelBand seed={1} />

      <section className="grid gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:px-12">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 font-mono text-xs text-accent"><span className="h-2 w-2 bg-accent pixel-pulse" /> REDE SOCIAL GAMER</p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[1.05] md:text-6xl">Sua rede.<br /><span className="text-chrome">Sua mídia.</span><br />Seu corre.</h1>
          <p className="mt-6 max-w-md text-muted-foreground">Uma plataforma unificada para conectar pessoas, compartilhar o que você cria e negociar itens digitais com segurança.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground hover:bg-foreground">Criar conta <ArrowRight size={16} /></Link>
            <Link to="/feed" className="inline-flex items-center gap-2 border border-border px-6 py-3 font-mono text-sm uppercase hover:border-primary">Ver o feed</Link>
          </div>
        </div>
        <img src={voxel} alt="Escultura voxel cromada" width={1024} height={1024} className="mx-auto w-full max-w-md" />
      </section>

      <section className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(({ n, t, d, I }) => (
          <div key={n} className="bg-background p-7">
            <p className="font-mono text-sm text-accent">[ {n} ]</p>
            <I className="mt-5 text-chrome" size={26} />
            <h2 className="mt-4 font-display text-lg font-extrabold uppercase">{t}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-10 bg-void px-5 py-16 md:grid-cols-2 md:items-center md:px-12">
        <img src={network} alt="Rede voxel cromada de pessoas e conversas" loading="lazy" width={1024} height={1024} className="mx-auto w-full max-w-md" />
        <div>
          <p className="font-mono text-xs uppercase text-accent">Início × Feed</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold uppercase md:text-5xl">Amigos de um lado.<br /><span className="text-chrome">O mundo do outro.</span></h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3"><Users size={18} className="shrink-0 text-foreground" />Início mostra apenas posts e reposts dos seus amigos.</li>
            <li className="flex gap-3"><Search size={18} className="shrink-0 text-foreground" />Feed traz novas pessoas, criadores em alta e sugestões para seguir.</li>
            <li className="flex gap-3"><ArrowBigUp size={18} className="shrink-0 text-foreground" />Dê Up no que é bom e reposte para o seu perfil.</li>
          </ul>
        </div>
      </section>

      <div className="overflow-hidden border-y border-border py-3">
        <div className="marquee flex w-max gap-10 font-mono text-xs uppercase text-muted-foreground">
          {Array.from({ length: 4 }).flatMap((_, k) => ["Up", "Repost", "Chat", "Creator", "Explorar", "Perfil"].map((w) => <span key={`${k}${w}`} className="flex items-center gap-2"><Repeat2 size={12} className="text-accent" />{w}</span>))}
        </div>
      </div>

      <section className="grid gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:px-12">
        <div>
          <p className="font-mono text-xs uppercase text-accent">Mídia & marketplace</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold uppercase md:text-5xl">Mostre.<br /><span className="text-chrome">Negocie.</span></h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">Contas de jogos, gift cards e itens digitais com checkout mediado. O marketplace abre em janeiro — a comunidade já está ativa.</p>
          <p className="mt-6 inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[11px] uppercase"><ShieldCheck size={14} className="text-accent" />Pré-lançamento · Janeiro</p>
        </div>
        <img src={media} alt="Câmera e fotos em voxel cromado" loading="lazy" width={1024} height={1024} className="mx-auto w-full max-w-md" />
      </section>
      <PixelBand seed={4} />
    </main>
  );
}
