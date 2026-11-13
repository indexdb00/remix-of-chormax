import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, ArrowUpRight, Blocks, Bell, Code2, Compass, Handshake,
  Image as ImageIcon, MessageCircle, Package, Repeat2, Rocket, Search,
  ShieldCheck, ShoppingBag, Sparkles, Store, Terminal, Users,
} from "lucide-react";
import voxel from "@/assets/voxel-chrome.jpg";
import network from "@/assets/voxel-network.jpg";
import media from "@/assets/voxel-media.jpg";

const pixelRow = (seed: number, n = 40) => Array.from({ length: n }, (_, i) => ((i * 7 + seed * 13) % 11) < 5);
function PixelBand({ seed }: { seed: number }) {
  return <div aria-hidden className="w-full overflow-hidden">{[0, 1, 2].map((r) => <div key={r} className="grid grid-cols-[repeat(40,1fr)]">{pixelRow(seed + r).map((on, i) => <div key={i} className={`aspect-square ${on && (r === 0 || i % (r + 2)) ? "bg-primary" : ""}`} />)}</div>)}</div>;
}

const sales = [
  { product: "Template SaaS Dashboard", category: "Template", price: "R$ 149,00", buyer: "um novo cliente", initials: "SD" },
  { product: "Plugin de automação", category: "Plugin", price: "R$ 89,00", buyer: "uma pessoa da comunidade", initials: "PL" },
  { product: "Kit UI para React", category: "Componentes", price: "R$ 59,00", buyer: "um novo comprador", initials: "UI" },
];

const pillars = [
  { n: "01", t: "Networking", d: "Conheça outros devs, siga criadores, faça conexões e encontre pessoas para tirar ideias do papel.", I: Users },
  { n: "02", t: "Mídia & comunidade", d: "Compartilhe atualizações, mostre seu processo, receba feedback e descubra o que a comunidade está criando.", I: ImageIcon },
  { n: "03", t: "Chat & colaboração", d: "Converse, troque conhecimento e aproxime talentos, parceiros e possíveis clientes.", I: MessageCircle },
  { n: "04", t: "Projetos digitais", d: "Apresente ferramentas, plugins, templates, componentes, produtos e experiências que você desenvolveu.", I: Package },
];

const categories = [
  { label: "SaaS & Micro-SaaS", detail: "Produtos e aplicações independentes", I: Rocket },
  { label: "Templates & UI Kits", detail: "Interfaces, layouts e recursos visuais", I: Blocks },
  { label: "Plugins & automações", detail: "Extensões, integrações e produtividade", I: Terminal },
  { label: "Ferramentas & código", detail: "Componentes, bibliotecas e utilitários", I: Code2 },
];

export function Landing() {
  const [saleIndex, setSaleIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSaleIndex((current) => (current + 1) % sales.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  const sale = sales[saleIndex];

  return (
    <main className="min-h-screen overflow-hidden bg-background pb-20 font-sans text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-12">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">chroma<span className="text-chrome">X</span></Link>
        <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:flex" aria-label="Navegação da landing">
          <a href="#ecossistema" className="transition-colors hover:text-foreground">Ecossistema</a>
          <a href="#criadores" className="transition-colors hover:text-foreground">Para devs</a>
          <a href="#network-dev" className="transition-colors hover:text-foreground">Network Dev</a>
        </nav>
        <Link to="/auth" className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground">Entrar <ArrowRight size={14} /></Link>
      </header>
      <PixelBand seed={1} />

      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-12 md:py-24">
        <div className="relative z-10">
          <p className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.2em] text-accent"><span className="h-2 w-2 bg-accent pixel-pulse" /> A rede de quem cria o digital</p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[1.08] md:text-6xl lg:text-7xl">Crie.<br /><span className="text-chrome">Conecte.</span><br />Monetize.</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">O ponto de encontro entre desenvolvedores, projetos digitais e pessoas curiosas pelo universo da tecnologia. Mostre o que você constrói, descubra novas ideias e encontre sua próxima conexão.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-foreground">Sou dev · Quero criar <ArrowRight size={16} /></Link>
            <Link to="/explorar" className="inline-flex items-center gap-2 border border-border px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors hover:border-accent hover:text-accent">Quero explorar <Compass size={16} /></Link>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Uma comunidade para quem desenvolve — e para quem quer descobrir.</p>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-8 bg-primary/10 blur-3xl" />
          <img src={voxel} alt="Escultura abstrata em voxel cromado, identidade visual ChromaX" width={1024} height={1024} className="relative mx-auto w-full drop-shadow-[0_25px_55px_rgba(0,0,0,0.45)]" />
          <div className="absolute bottom-3 left-0 flex items-center gap-3 border border-border bg-background/90 px-4 py-3 shadow-2xl backdrop-blur-md sm:bottom-10 sm:left-[-2rem]">
            <span className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground"><Sparkles size={17} /></span>
            <span><span className="block font-mono text-[9px] uppercase tracking-widest text-accent">Ideias em movimento</span><span className="font-display text-xs font-bold uppercase">Seu próximo projeto começa aqui</span></span>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-void px-5 py-12 md:px-12" aria-labelledby="sales-title">
        <div className="mx-auto grid max-w-7xl gap-9 md:grid-cols-[.85fr_1.15fr] md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Do projeto ao próximo passo</p>
            <h2 id="sales-title" className="mt-3 font-display text-2xl font-extrabold uppercase md:text-4xl">Seu trabalho merece <span className="text-chrome">ser visto.</span></h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">Imagine publicar seu produto e receber uma nova oportunidade. Esta prévia mostra como uma notificação de venda pode aparecer para quem cria.</p>
          </div>
          <div className="relative mx-auto w-full max-w-xl border border-border bg-background p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"><Bell size={14} className="text-accent" /> Central de notificações</span>
              <span className="border border-accent/40 px-2 py-1 font-mono text-[9px] uppercase text-accent">Demonstração</span>
            </div>
            <div className="relative min-h-[126px]" aria-live="polite" aria-atomic="true">
              <div key={saleIndex} className="flex animate-in fade-in slide-in-from-bottom-2 duration-500 items-start gap-4 border border-accent/30 bg-accent/5 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center border border-accent/30 bg-background font-display text-xs font-bold text-accent">{sale.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-display text-xs font-bold uppercase">Venda realizada</span><span className="font-mono text-[9px] uppercase text-accent">Exemplo visual</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{sale.buyer} adquiriu:</p>
                  <p className="mt-1 truncate text-sm font-semibold">{sale.product}</p>
                  <div className="mt-3 flex items-center justify-between gap-3"><span className="font-mono text-[10px] uppercase text-muted-foreground">{sale.category}</span><span className="font-mono text-sm font-bold text-accent">{sale.price}</span></div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Notificações fictícias para ilustrar a experiência · Não representa transações reais</p>
          </div>
        </div>
      </section>

      <section id="criadores" className="mx-auto max-w-7xl px-5 py-16 md:px-12 md:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Dois caminhos. Uma comunidade.</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold uppercase md:text-5xl">Tem espaço para <span className="text-chrome">todo mundo.</span></h2>
        </div>
        <div className="mt-9 grid gap-px border border-border bg-border md:grid-cols-2">
          <article className="bg-background p-7 md:p-10">
            <div className="flex items-center justify-between"><Code2 size={30} className="text-accent" /><span className="font-mono text-[10px] text-muted-foreground">01 / CRIADORES</span></div>
            <h3 className="mt-7 font-display text-2xl font-extrabold uppercase">Você constrói.<br /><span className="text-chrome">O mundo descobre.</span></h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Use seu espaço para apresentar projetos, compartilhar atualizações, divulgar ferramentas e aproximar seu trabalho de pessoas interessadas em conhecer, usar ou negociar suas criações.</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><Store size={17} className="shrink-0 text-accent" /> Apresente produtos e projetos digitais.</li>
              <li className="flex gap-3"><ShoppingBag size={17} className="shrink-0 text-accent" /> Divulgue templates, plugins e ferramentas.</li>
              <li className="flex gap-3"><Handshake size={17} className="shrink-0 text-accent" /> Encontre parceiros, clientes e colaboradores.</li>
            </ul>
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 border border-primary px-5 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors hover:bg-primary hover:text-primary-foreground">Quero mostrar meu projeto <ArrowUpRight size={15} /></Link>
          </article>
          <article className="bg-void p-7 md:p-10">
            <div className="flex items-center justify-between"><Compass size={30} className="text-accent" /><span className="font-mono text-[10px] text-muted-foreground">02 / EXPLORADORES</span></div>
            <h3 className="mt-7 font-display text-2xl font-extrabold uppercase">Curioso por tecnologia?<br /><span className="text-chrome">Chegue mais perto.</span></h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Você não precisa programar para fazer parte. Descubra como os produtos digitais nascem, acompanhe criadores, conheça ferramentas e participe das conversas.</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><Search size={17} className="shrink-0 text-accent" /> Explore projetos e ideias diferentes.</li>
              <li className="flex gap-3"><Users size={17} className="shrink-0 text-accent" /> Siga pessoas e conheça comunidades.</li>
              <li className="flex gap-3"><MessageCircle size={17} className="shrink-0 text-accent" /> Aprenda, pergunte e faça conexões.</li>
            </ul>
            <Link to="/explorar" className="mt-8 inline-flex items-center gap-2 border border-border px-5 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors hover:border-accent hover:text-accent">Descobrir a comunidade <ArrowUpRight size={15} /></Link>
          </article>
        </div>
      </section>

      <section id="ecossistema" className="border-y border-border bg-void px-5 py-16 md:px-12 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 md:items-center">
          <img src={network} alt="Rede de conexões em estética voxel cromada" loading="lazy" width={1024} height={1024} className="mx-auto w-full max-w-md" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">O que é Network Dev?</p>
            <h2 id="network-dev" className="mt-3 font-display text-3xl font-extrabold uppercase md:text-5xl">Mais que código.<br /><span className="text-chrome">É conexão.</span></h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">Network Dev é a rede de pessoas que cria, compartilha e movimenta o universo digital. Desenvolvedores, designers, makers, empreendedores e curiosos podem trocar experiências e descobrir oportunidades.</p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Uma ideia pode virar um projeto. Um projeto pode encontrar seus primeiros usuários. Uma conversa pode virar parceria. A ChromaX quer aproximar essas possibilidades em um só ambiente.</p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {pillars.map(({ n, t, d, I }) => <div key={n} className="border border-border bg-background/70 p-4"><I size={19} className="text-accent" /><p className="mt-3 font-display text-xs font-bold uppercase">{t}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{d}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:px-12 md:py-24">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">O que ganha vida aqui</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold uppercase md:text-5xl">Ideias em forma de <span className="text-chrome">produto.</span></h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">De uma pequena automação a um produto completo: a comunidade é um espaço para apresentar o que você está construindo e encontrar pessoas que se interessem pelo seu trabalho.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {categories.map(({ label, detail, I }) => <div key={label} className="flex gap-3 border border-border p-4"><I size={20} className="mt-0.5 shrink-0 text-chrome" /><div><p className="font-display text-[11px] font-bold uppercase">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>)}
          </div>
        </div>
        <img src={media} alt="Criação de mídia e projetos em voxel cromado" loading="lazy" width={1024} height={1024} className="mx-auto w-full max-w-md" />
      </section>

      <div className="overflow-hidden border-y border-border py-4">
        <div className="marquee flex w-max gap-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {Array.from({ length: 4 }).flatMap((_, k) => ["Build", "Share", "Connect", "Discover", "Create", "Monetize"].map((w) => <span key={`${k}-${w}`} className="flex items-center gap-2"><Repeat2 size={12} className="text-accent" />{w}</span>))}
        </div>
      </div>

      <section className="px-5 py-20 text-center md:px-12 md:py-28">
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Seu lugar no ecossistema</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-extrabold uppercase md:text-6xl">O próximo projeto pode começar com uma <span className="text-chrome">conexão.</span></h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Entre para compartilhar o que você cria, descobrir o que outras pessoas estão construindo e fazer parte da próxima ideia.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 bg-primary px-7 py-4 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-foreground">Entrar na ChromaX <ArrowRight size={16} /></Link>
          <Link to="/explorar" className="inline-flex items-center gap-2 border border-border px-7 py-4 font-mono text-xs uppercase tracking-wider transition-colors hover:border-accent hover:text-accent">Explorar projetos <Compass size={16} /></Link>
        </div>
      </section>

      <PixelBand seed={4} />
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 font-mono text-[9px] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-12">
        <span>chromaX · Build your network</span>
        <span>Crie · Conecte · Descubra</span>
      </footer>
    </main>
  );
}
