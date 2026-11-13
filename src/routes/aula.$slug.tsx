import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Circle, Lightbulb, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { findAcademyLesson } from "@/lib/academy";

export const Route = createFileRoute("/aula/$slug")({ component: LessonPage });

function LessonPage() {
  const { slug } = Route.useParams();
  const lesson = findAcademyLesson(slug);
  const [completed, setCompleted] = useState(false);

  if (!lesson) return <main className="min-h-screen bg-[#090909] p-8 text-white"><SiteHeader /><div className="mx-auto max-w-xl py-16 text-center"><h1 className="text-xl font-semibold">Aula não encontrada</h1><Link to="/explorar" className="mt-5 inline-flex text-sm underline">Voltar ao catálogo</Link></div></main>;

  const course = lesson.course;
  const lessons = course.modules.flatMap((module) => module.lessons);
  const index = lessons.findIndex((item) => item.slug === slug);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];

  return <main className="min-h-screen bg-[#090909] pb-32 text-white"><SiteHeader /><section className="mx-auto max-w-5xl px-4 py-5 sm:px-8 sm:py-8">
    <Link to="/curso/$slug" params={{ slug: course.slug }} className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14} />{course.title}</Link>
    <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]"><article>
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[.18em] text-white/40">{course.area} · Aula {index + 1} de {lessons.length}</span><span className="bg-white/[.07] px-2.5 py-1 text-[9px] text-white/50">Aula demonstrativa</span></div>
      <h1 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">{lesson.title}</h1>
      <div className="mt-5 flex min-h-44 items-center justify-center bg-[#151515] p-6 text-center sm:min-h-56"><div className="max-w-md"><BookOpen size={25} className="mx-auto text-white/45" /><p className="mt-4 text-sm font-semibold">Aprenda o conceito. Aplique no seu projeto.</p><p className="mt-2 text-xs leading-5 text-white/40">Esta etapa apresenta o conteúdo em formato de leitura. Vídeos e materiais completos serão adicionados ao ambiente de cursos.</p></div></div>
      <div className="mt-7"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-white/35">Objetivo da aula</p><p className="mt-2 text-sm leading-6 text-white/75">{lesson.objective}</p></div>
      <div className="mt-7 space-y-4">{lesson.content.map((paragraph, i) => <div key={i} className="flex gap-3"><span className="mt-1 grid h-6 w-6 shrink-0 place-items-center bg-white/[.07] font-mono text-[9px] text-white/50">{i + 1}</span><p className="text-sm leading-7 text-white/65">{paragraph}</p></div>)}</div>
      <div className="mt-8 bg-[#151515] p-5"><div className="flex items-center gap-2 text-xs font-semibold"><Lightbulb size={15} /> Desafio prático</div><p className="mt-3 text-sm leading-6 text-white/60">{lesson.exercise}</p></div>
      <Link to="/laboratorio" search={{ course: course.slug }} className="mt-5 flex w-full items-center justify-center gap-2 border border-white/15 px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/[.06]"><Sparkles size={14}/> Aplicar esta aula no meu projeto</Link>
      <button type="button" onClick={() => setCompleted((value) => !value)} className={"mt-7 flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition " + (completed ? "bg-white/[.12] text-white" : "bg-white text-black")}>{completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}{completed ? "Aula marcada nesta sessão" : "Marcar aula como concluída"}</button>
      <p className="mt-2 text-center text-[9px] text-white/30">A marcação é temporária e não é salva no seu perfil nesta versão.</p>
      <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/[.08] pt-5">{previous ? <Link to="/aula/$slug" params={{ slug: previous.slug }} className="inline-flex items-center gap-2 text-xs text-white/55 hover:text-white"><ChevronLeft size={15} /> Aula anterior</Link> : <span />}{next ? <Link to="/aula/$slug" params={{ slug: next.slug }} className="inline-flex items-center gap-2 bg-white px-4 py-3 text-xs font-bold text-black">Próxima aula <ChevronRight size={15} /></Link> : <Link to="/curso/$slug" params={{ slug: course.slug }} className="inline-flex items-center gap-2 bg-white px-4 py-3 text-xs font-bold text-black">Voltar ao curso <ArrowRight size={14} /></Link>}</div>
    </article>
    <aside className="h-fit bg-[#141414] p-4"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-white/35">Neste curso</p><h2 className="mt-2 text-sm font-semibold">{course.title}</h2><div className="mt-4 space-y-1">{lessons.map((item, i) => <Link key={item.slug} to="/aula/$slug" params={{ slug: item.slug }} className={"flex items-center gap-2 px-2 py-2.5 text-left text-[10px] transition " + (item.slug === slug ? "bg-white/[.1] text-white" : "text-white/45 hover:bg-white/[.05] hover:text-white")}><span className="font-mono text-[9px]">{String(i + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1">{item.title}</span>{item.slug === slug && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</Link>)}</div><Link to="/trilhas" className="mt-5 flex items-center justify-between border-t border-white/[.08] pt-4 text-[10px] text-white/45 hover:text-white">Ver trilhas <ArrowRight size={13} /></Link></aside></div>
  </section></main>;
}
