import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BrainCircuit, Code2, Compass, GraduationCap, Layers3, Palette, ShieldCheck, Sparkles, Terminal, Workflow } from "lucide-react";
import voxel from "@/assets/voxel-chrome.jpg";

const schools = [
  { title: "IA & Vibe Coding", copy: "Crie produtos, agentes e automações com inteligência artificial.", icon: BrainCircuit, number: "01" },
  { title: "Frontend & Web", copy: "Interfaces modernas, acessíveis e responsivas, do zero ao avançado.", icon: Code2, number: "02" },
  { title: "Backend & Engenharia", copy: "APIs, bancos de dados, arquitetura, integrações e deploy.", icon: Terminal, number: "03" },
  { title: "Design & UX/UI", copy: "Pesquisa, prototipação, sistemas visuais e experiência de produto.", icon: Palette, number: "04" },
  { title: "Cibersegurança", copy: "Redes, segurança web, defesa e laboratórios controlados.", icon: ShieldCheck, number: "05" },
  { title: "Produto & Carreira", copy: "Portfólio, documentação, colaboração e prática profissional.", icon: Workflow, number: "06" },
];

const paths = [
  { title: "Desenvolvedor com IA", meta: "IA · Frontend · Backend", copy: "Da primeira ideia ao produto full-stack." },
  { title: "Designer de Produto", meta: "UX Research · UI · Design System", copy: "Transforme problemas reais em experiências." },
  { title: "Fundamentos de Segurança", meta: "Redes · Linux · Web Security", copy: "Aprenda defesa digital com prática responsável." },
];

export function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] pb-16 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">chroma<span className="text-white/45">X</span></Link>
        <nav className="hidden items-center gap-7 text-xs text-white/45 md:flex">
          <a href="#escolas" className="transition hover:text-white">Escolas</a>
          <a href="#trilhas" className="transition hover:text-white">Trilhas</a>
          <a href="#metodo" className="transition hover:text-white">Método</a>
        </nav>
        <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-white/85">Entrar <ArrowUpRight size={14}/></Link>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_.92fr]">
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-white/[.045] blur-[100px]"/>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[.07] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.2em] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Escola digital · Tecnologia & criatividade</span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">Aprenda hoje. <span className="text-white/40">Construa o que vem depois.</span></h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/55 sm:text-base">Uma jornada prática por inteligência artificial, desenvolvimento, design e segurança. Aprenda com projetos, evolua por trilhas e transforme conhecimento em trabalho que você pode compartilhar.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3.5 text-xs font-bold text-black transition hover:bg-white/85">Começar a aprender <ArrowRight size={15}/></Link>
            <a href="#escolas" className="inline-flex items-center gap-2 rounded-full bg-white/[.07] px-5 py-3.5 text-xs font-semibold text-white/80 transition hover:bg-white/[.12]">Explorar escolas <Compass size={15}/></a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-white/35"><span className="flex items-center gap-2"><Layers3 size={13}/> Trilhas guiadas</span><span className="flex items-center gap-2"><GraduationCap size={13}/> Certificados por critérios</span><span className="flex items-center gap-2"><Sparkles size={13}/> Aprendizagem prática</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-10 rounded-full bg-white/[.08] blur-[85px]"/>
          <img src={voxel} alt="Escultura geométrica cromada da identidade ChromaX" className="relative mx-auto w-full drop-shadow-[0_28px_65px_rgba(255,255,255,.08)]"/>
          <div className="absolute bottom-2 left-1 rounded-2xl bg-[#151515]/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-8 sm:left-0"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><Sparkles size={17}/></span><div><p className="text-[9px] uppercase tracking-widest text-white/40">O próximo passo</p><p className="mt-1 text-xs font-semibold">Aprender · Praticar · Compartilhar</p></div></div></div>
        </div>
      </section>

      <section id="escolas" className="scroll-mt-8 bg-[#101010] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="max-w-2xl"><p className="font-mono text-[9px] uppercase tracking-[.22em] text-white/40">Seis escolas · Uma jornada</p><h2 className="mt-3 font-display text-2xl font-bold sm:text-4xl">Conhecimento para <span className="text-white/40">construir de verdade.</span></h2><p className="mt-3 text-sm leading-6 text-white/45">Escolha uma especialidade ou combine áreas para desenvolver habilidades completas.</p></div><Link to="/auth" className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-white/75 transition hover:text-white">Acessar plataforma <ArrowUpRight size={14}/></Link></div>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map(({title,copy,icon:Icon,number})=><article key={title} className="group min-h-44 bg-[#181818] p-5 transition hover:bg-[#202020]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center bg-white/[.07] text-white/80"><Icon size={19}/></span><span className="font-mono text-[9px] text-white/25">{number}</span></div><h3 className="mt-5 text-sm font-semibold">{title}</h3><p className="mt-2 max-w-sm text-xs leading-5 text-white/45">{copy}</p></article>)}
          </div>
        </div>
      </section>

      <section id="trilhas" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl"><p className="font-mono text-[9px] uppercase tracking-[.22em] text-white/40">Aprendizado com direção</p><h2 className="mt-3 font-display text-2xl font-bold sm:text-4xl">Não é só assistir. <span className="text-white/40">É chegar a algum lugar.</span></h2><p className="mt-3 text-sm leading-6 text-white/45">As trilhas conectam fundamentos, prática e projetos para você saber o que estudar e como evoluir.</p></div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">{paths.map((path,index)=><article key={path.title} className="bg-[#141414] p-5"><span className="font-mono text-[9px] text-white/35">TRILHA 0{index+1}</span><h3 className="mt-5 text-base font-semibold">{path.title}</h3><p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">{path.meta}</p><p className="mt-4 text-xs leading-5 text-white/50">{path.copy}</p></article>)}</div>
      </section>

      <section id="metodo" className="border-y border-white/10 bg-[#101010] px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-white/40">Aprendizagem aplicada</p><h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">Conhecimento que aparece no seu portfólio.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/50">Cada jornada deve aproximar teoria e prática: exercícios, projetos finais, feedback e uma comunidade para trocar experiências. Seus projetos continuam nas publicações e podem compor seu perfil compartilhável.</p></div>
          <div className="grid gap-2 sm:grid-cols-2"><div className="bg-[#191919] p-5"><GraduationCap size={20} className="text-white/70"/><h3 className="mt-4 text-sm font-semibold">Certificação clara</h3><p className="mt-2 text-xs leading-5 text-white/45">Critérios de conclusão e avaliação definidos por curso.</p></div><div className="bg-[#191919] p-5"><ShieldCheck size={20} className="text-white/70"/><h3 className="mt-4 text-sm font-semibold">Segurança em primeiro lugar</h3><p className="mt-2 text-xs leading-5 text-white/45">Privacidade, controle de acesso e laboratórios autorizados.</p></div></div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-[10px] text-white/30 sm:flex-row sm:justify-between sm:px-8"><span>chromaX · Aprenda. Construa. Evolua.</span><span>IA · Código · Design · Segurança</span></footer>
    </main>
  );
}
