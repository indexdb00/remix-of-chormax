import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Award, BookOpen, Compass, Sparkles } from "lucide-react";
import { academyCourses } from "@/lib/academy";

export function AcademyProfileLinks() {
  return (
    <section className="mt-5 border-y border-white/[.08] py-4 sm:mt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-white/35">Sua jornada ChromaX</p>
          <h2 className="mt-1 text-sm font-semibold text-white">Aprendizagem e projetos</h2>
        </div>
        <Link to="/aprendizado" className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-white">Minha jornada <ArrowUpRight size={12}/></Link>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link to="/aprendizado" className="flex min-h-[76px] flex-col justify-between bg-white/[.045] p-3 transition hover:bg-white/[.09]">
          <BookOpen size={16} className="text-white/65"/>
          <span className="text-[10px] font-medium text-white/80">Aprendizagem</span>
        </Link>
        <Link to="/laboratorio" className="flex min-h-[76px] flex-col justify-between bg-white/[.045] p-3 transition hover:bg-white/[.09]">
          <Sparkles size={16} className="text-white/65"/>
          <span className="text-[10px] font-medium text-white/80">Meu Laboratório</span>
        </Link>
        <Link to="/certificados" className="flex min-h-[76px] flex-col justify-between bg-white/[.045] p-3 transition hover:bg-white/[.09]">
          <Award size={16} className="text-white/65"/>
          <span className="text-[10px] font-medium text-white/80">Certificados</span>
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-[9px] uppercase tracking-wider text-white/30">Cursos</span>
        {academyCourses.slice(0, 3).map((course) => (
          <Link key={course.slug} to="/curso/$slug" params={{ slug: course.slug }} className="shrink-0 bg-white/[.045] px-3 py-2 text-[9px] text-white/60 transition hover:bg-white/[.09] hover:text-white">{course.area}</Link>
        ))}
        <Link to="/explorar" className="inline-flex shrink-0 items-center gap-1 px-2 py-2 text-[9px] text-white/45 hover:text-white">Explorar <Compass size={11}/></Link>
      </div>
      <p className="mt-2 text-[9px] leading-4 text-white/25">Seus projetos continuam nas publicações do perfil. Ao concluir cursos, seu histórico acadêmico poderá complementar este portfólio.</p>
    </section>
  );
}
