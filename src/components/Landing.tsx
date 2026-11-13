import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Blocks, Code2, CreditCard, Layers3, Package, Palette, Puzzle, Rocket, ShieldCheck, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import voxel from "@/assets/voxel-chrome.jpg";

const categories = [
  { title: "SaaS & Micro-SaaS", copy: "Aplicações, assinaturas e ferramentas online.", icon: Rocket },
  { title: "Serviços digitais", copy: "Desenvolvimento, design, consultoria e suporte.", icon: Wrench },
  { title: "Templates & UI Kits", copy: "Interfaces, componentes e recursos visuais.", icon: Palette },
  { title: "Plugins & automações", copy: "Extensões, integrações e fluxos inteligentes.", icon: Puzzle },
  { title: "Software & código", copy: "Bibliotecas, scripts, licenças e utilitários.", icon: Code2 },
  { title: "Produtos digitais", copy: "E-books, arquivos, materiais e conteúdos.", icon: Package },
];

export function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090909] pb-12 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">chroma<span className="text-white/45">X</span></Link>
        <nav className="hidden items-center gap-7 text-xs text-white/45 md:flex"><a href="#categorias" className="hover:text-white">Categorias</a><a href="#como-funciona" className="hover:text-white">Como funciona</a><a href="#seguranca" className="hover:text-white">Segurança</a></nav>
        <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold transition hover:bg-white hover:text-black">Acessar conta <ArrowUpRight size={14}/></Link>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-white/[.035] blur-[100px]"/>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.2em] text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Marketplace & pagamentos digitais</span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">Seu negócio digital. <span className="text-white/45">Em um só lugar.</span></h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/55 sm:text-base">A ChromaX conecta quem cria e quem compra SaaS, serviços e produtos digitais. Organize seu catálogo, apresente suas soluções e acompanhe sua operação em uma experiência simples e profissional.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3.5 text-xs font-bold text-black transition hover:bg-white/85">Começar agora <ArrowRight size={15}/></Link><a href="#categorias" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3.5 text-xs font-semibold text-white/75 hover:bg-white/[.06]">Explorar categorias <ShoppingBag size={15}/></a></div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-white/35"><span className="flex items-center gap-2"><Layers3 size={13}/> Catálogo digital</span><span className="flex items-center gap-2"><CreditCard size={13}/> Gestão de cobranças</span><span className="flex items-center gap-2"><ShieldCheck size={13}/> Operação segura</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-10 rounded-full bg-white/[.07] blur-[85px]"/>
          <img src={voxel} alt="Escultura geométrica cromada da identidade ChromaX" className="relative mx-auto w-full drop-shadow-[0_28px_65px_rgba(255,255,255,.08)]"/>
          <div className="absolute bottom-2 left-1 rounded-2xl border border-white/10 bg-[#111]/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-8 sm:left-0"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><Sparkles size={17}/></span><div><p className="text-[9px] uppercase tracking-widest text-white/40">Ecossistema digital</p><p className="mt-1 text-xs font-semibold">Crie · Venda · Gerencie</p></div></div></div>
        </div>
      </section>

      <section id="categorias" className="border-y border-white/10 bg-[#101010] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="font-mono text-[9px] uppercase tracking-[.22em] text-white/40">O que você pode oferecer</p><h2 className="mt-3 font-display text-2xl font-bold sm:text-4xl">Tudo que movimenta o <span className="text-white/45">mercado digital.</span></h2><p className="mt-3 text-sm leading-6 text-white/45">Uma estrutura flexível para diferentes tipos de negócio, sem limitar o vendedor a um único segmento.</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(({title,copy,icon:Icon},i)=><article key={title} className="group rounded-2xl bg-[#181818] p-5 transition hover:bg-[#202020]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.07] text-white/75"><Icon size={19}/></span><span className="font-mono text-[9px] text-white/25">0{i+1}</span></div><h3 className="mt-5 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/40">{copy}</p></article>)}</div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-white/40">Painel do vendedor</p><h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">Mais clareza para cuidar do seu negócio.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-white/50">A área logada foi pensada para quem vende: catálogo, visão geral da operação, cobranças e carteira em uma navegação direta, com prioridade para o uso no celular.</p><Link to="/auth" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Acessar painel <ArrowUpRight size={14}/></Link></div>
        <div className="rounded-2xl bg-[#141414] p-4 sm:p-6"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-[9px] uppercase tracking-widest text-white/35">CHROMAX / DASHBOARD</p><p className="mt-1 text-sm font-semibold">Visão geral</p></div><div className="rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-black">Painel</div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#202020] p-4"><p className="text-[10px] text-white/40">Produtos</p><p className="mt-3 text-2xl font-semibold">—</p></div><div className="rounded-xl bg-[#202020] p-4"><p className="text-[10px] text-white/40">Vendas registradas</p><p className="mt-3 text-2xl font-semibold">—</p></div></div><div className="mt-3 rounded-xl bg-[#202020] p-4"><div className="flex items-center gap-2 text-xs font-medium"><CreditCard size={15}/> Cobranças e recebimentos</div><p className="mt-2 text-[10px] leading-5 text-white/40">Área preparada para integrar o provedor de pagamentos.</p></div></div>
      </section>

      <section id="seguranca" className="border-y border-white/10 bg-[#101010] px-5 py-14 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex max-w-2xl gap-4"><ShieldCheck className="mt-1 shrink-0 text-white/65" size={25}/><div><h2 className="text-sm font-semibold">Transparência em cada etapa</h2><p className="mt-2 text-xs leading-6 text-white/45">A carteira e o processamento de pagamentos só serão apresentados como ativos depois que o gateway estiver conectado e validado. Sem saldos ou transações fictícias.</p></div></div><Link to="/auth" className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-bold text-black">Criar minha conta <ArrowRight size={14}/></Link></div></section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-[10px] text-white/30 sm:flex-row sm:justify-between sm:px-8"><span>chromaX · Marketplace digital</span><span>SaaS · Serviços · Produtos digitais</span></footer>
    </main>
  );
}
