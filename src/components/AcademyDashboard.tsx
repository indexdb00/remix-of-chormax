import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, ArrowUpRight, BrainCircuit, CheckCircle2, Code2, Compass, GraduationCap, Layers3, Palette, Search, ShieldCheck, Sparkles, Terminal, Workflow, X } from "lucide-react";

const schools = [
  { id: "all", label: "Todas as áreas", icon: Compass },
  { id: "ai", label: "IA & Vibe Coding", icon: BrainCircuit },
  { id: "frontend", label: "Frontend", icon: Code2 },
  { id: "backend", label: "Backend", icon: Terminal },
  { id: "design", label: "Design & UX", icon: Palette },
  { id: "security", label: "Cibersegurança", icon: ShieldCheck },
  { id: "product", label: "Produto & carreira", icon: Workflow },
];

const courses = [
  { id: "ai-apps", title: "Construa seu primeiro app com IA", school: "ai", area: "IA & Vibe Coding", level: "Iniciante", lessons: "Projeto guiado", description: "Transforme uma ideia em um protótipo funcional usando prompts, ferramentas visuais e ciclos de validação.", skills: ["Prompt engineering", "Vibe coding", "Prototipação"] },
  { id: "react", title: "Interfaces modernas com React", school: "frontend", area: "Frontend", level: "Intermediário", lessons: "Fundamentos e prática", description: "Componentes, estado, composição, acessibilidade e interfaces responsivas com uma arquitetura sustentável.", skills: ["React", "TypeScript", "Acessibilidade"] },
  { id: "api", title: "APIs e arquitetura de backend", school: "backend", area: "Backend", level: "Intermediário", lessons: "Fundamentos e prática", description: "Entenda APIs, persistência, autenticação, validação e os limites de confiança entre cliente e servidor.", skills: ["APIs", "Banco de dados", "Autenticação"] },
  { id: "ux", title: "UX Research e design de produto", school: "design", area: "Design & UX", level: "Iniciante", lessons: "Pesquisa e projeto", description: "Investigue necessidades, mapeie jornadas, prototipe soluções e valide decisões de experiência.", skills: ["UX Research", "Figma", "Prototipação"] },
  { id: "web-security", title: "Fundamentos de segurança web", school: "security", area: "Cibersegurança", level: "Iniciante", lessons: "Conceitos e laboratório", description: "Aprenda princípios de segurança web e práticas defensivas em ambientes de laboratório autorizados.", skills: ["OWASP", "Redes", "Defesa"] },
  { id: "product", title: "Do projeto ao portfólio profissional", school: "product", area: "Produto & carreira", level: "Todos os níveis", lessons: "Projeto aplicado", description: "Organize escopo, documentação, apresentação e evidências do que você construiu.", skills: ["Documentação", "Portfólio", "Produto"] },
];

type Course = typeof courses[number];

export function AcademyDashboard({ user }: { user: User }) {
  const [school, setSchool] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "estudante";
  const visibleCourses = useMemo(() => courses.filter((course) => (school === "all" || course.school === school) && (course.title + course.area + course.skills.join(" ")).toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))), [school, query]);

  return (
    <main className="min-h-screen bg-[#090909] pb-32 text-white">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#090909]/90 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight">chroma<span className="text-white/45">X</span></Link>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-white/45 sm:block">{user.email}</span><Link to="/perfil" aria-label="Meu perfil" className="grid h-9 w-9 place-items-center rounded-full bg-white text-black"><span className="text-xs font-bold">{displayName.slice(0,1).toUpperCase()}</span></Link></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <section className="relative overflow-hidden bg-[#141414] p-5 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/[.06] blur-[90px]"/>
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.2em] text-white/45"><Sparkles size={13}/> Seu espaço de aprendizagem</span>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-4xl">Vamos construir algo novo, {displayName}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Escolha uma habilidade, encontre uma trilha e transforme o que aprender em projetos reais.</p>
            <a href="#catalogo" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-bold text-black transition hover:bg-white/85">Explorar cursos <ArrowRight size={14}/></a>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-white/35">Seu mapa de evolução</p><h2 className="mt-2 text-lg font-semibold">Escolha por onde começar</h2></div><span className="hidden text-[10px] text-white/35 sm:block">Aprenda no seu ritmo</span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{[
            { title: "Criar com inteligência artificial", detail: "Apps, agentes e automações", icon: BrainCircuit, target: "ai" },
            { title: "Desenvolver para a web", detail: "Frontend, backend e full-stack", icon: Code2, target: "frontend" },
            { title: "Projetar experiências", detail: "UX, UI e produto digital", icon: Palette, target: "design" },
          ].map(({title,detail,icon:Icon,target})=><button key={title} onClick={()=>{setSchool(target);document.getElementById("catalogo")?.scrollIntoView({behavior:"smooth"});}} className="flex items-center gap-3 bg-[#141414] p-4 text-left transition hover:bg-[#1c1c1c]"><span className="grid h-10 w-10 shrink-0 place-items-center bg-white/[.07] text-white/75"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{title}</span><span className="mt-1 block text-[10px] text-white/40">{detail}</span></span><ArrowUpRight size={15} className="text-white/35"/></button>)}</div>
        </section>

        <section id="catalogo" className="mt-10 scroll-mt-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-white/35">Catálogo inicial</p><h2 className="mt-2 text-xl font-semibold">Explore as áreas de conhecimento</h2><p className="mt-1 text-xs text-white/40">Conteúdos de referência para estruturar a primeira versão da escola.</p></div><label className="flex h-10 w-full items-center gap-2 bg-[#171717] px-3 sm:max-w-xs"><Search size={15} className="text-white/40"/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar cursos e habilidades" className="w-full bg-transparent text-xs outline-none placeholder:text-white/35"/></label></div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{schools.map(({id,label,icon:Icon})=><button key={id} onClick={()=>setSchool(id)} className={"flex shrink-0 items-center gap-2 px-3 py-2 text-[10px] transition "+(school===id?"bg-white text-black":"bg-[#171717] text-white/55 hover:text-white")}><Icon size={13}/>{label}</button>)}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleCourses.map((course,index)=><article key={course.id} className="flex min-h-64 flex-col bg-[#141414] p-5 transition hover:bg-[#191919]"><div className="flex items-center justify-between gap-3"><span className="text-[9px] uppercase tracking-[.16em] text-white/40">{course.area}</span><span className="font-mono text-[9px] text-white/25">0{index+1}</span></div><h3 className="mt-6 text-base font-semibold leading-snug">{course.title}</h3><p className="mt-2 flex-1 text-xs leading-5 text-white/45">{course.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{course.skills.map(skill=><span key={skill} className="bg-white/[.06] px-2 py-1 text-[9px] text-white/55">{skill}</span>)}</div><div className="mt-5 flex items-center justify-between border-t border-white/[.08] pt-4"><span className="text-[10px] text-white/40">{course.level}</span><button onClick={()=>setSelected(course)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-white">Conhecer <ArrowRight size={13}/></button></div></article>)}</div>
          {!visibleCourses.length && <div className="py-14 text-center text-xs text-white/40">Nenhum conteúdo corresponde à sua busca.</div>}
          <p className="mt-5 text-[10px] leading-5 text-white/30">Prévia de catálogo: cursos, matrículas, aulas e progresso ainda serão conectados ao banco de dados na próxima etapa.</p>
        </section>

        <section className="mt-10 grid gap-3 md:grid-cols-2">
          <div className="bg-[#141414] p-5 sm:p-6"><div className="flex items-center gap-2 text-white/65"><GraduationCap size={18}/><span className="text-xs font-semibold">Certificados</span></div><h3 className="mt-4 text-base font-semibold">Aprendizado com critérios claros.</h3><p className="mt-2 text-xs leading-5 text-white/45">A emissão será vinculada à conclusão, avaliações e projetos exigidos em cada curso.</p></div>
          <div className="bg-[#141414] p-5 sm:p-6"><div className="flex items-center gap-2 text-white/65"><Layers3 size={18}/><span className="text-xs font-semibold">Seu portfólio</span></div><h3 className="mt-4 text-base font-semibold">Mostre o que você construiu.</h3><p className="mt-2 text-xs leading-5 text-white/45">Continue publicando projetos no feed e organize sua identidade profissional no perfil.</p><Link to="/perfil" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold underline underline-offset-4">Abrir meu perfil <ArrowUpRight size={13}/></Link></div>
        </section>
      </div>

      {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="course-title" onClick={()=>setSelected(null)}><section className="w-full max-w-lg bg-[#171717] p-5 shadow-2xl sm:p-7" onClick={(event)=>event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-white/40">{selected.area} · {selected.level}</p><h2 id="course-title" className="mt-3 text-xl font-semibold">{selected.title}</h2></div><button onClick={()=>setSelected(null)} aria-label="Fechar detalhes" className="p-1 text-white/55 hover:text-white"><X size={18}/></button></div><p className="mt-4 text-sm leading-6 text-white/55">{selected.description}</p><div className="mt-5"><p className="text-[10px] uppercase tracking-wider text-white/35">Habilidades abordadas</p><div className="mt-2 flex flex-wrap gap-2">{selected.skills.map(skill=><span key={skill} className="bg-white/[.07] px-3 py-2 text-[10px] text-white/75">{skill}</span>)}</div></div><div className="mt-6 flex items-start gap-2 bg-white/[.05] p-3 text-[10px] leading-5 text-white/45"><CheckCircle2 size={14} className="mt-0.5 shrink-0"/> Esta é uma prévia do currículo. A matrícula e o acesso às aulas serão liberados quando o sistema acadêmico estiver conectado.</div><button onClick={()=>setSelected(null)} className="mt-5 w-full bg-white px-4 py-3 text-xs font-bold text-black transition hover:bg-white/85">Entendi</button></section></div>}
    </main>
  );
}
