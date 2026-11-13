import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUp, BookOpen, Check, Code2, Lightbulb, LoaderCircle, Paperclip, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { academyCourses } from "@/lib/academy";

export const Route = createFileRoute("/_authenticated/laboratorio")({
  head: () => ({ meta: [{ title: "Meu Laboratório — ChromaX" }, { name: "description", content: "Transforme o que você aprende em projetos reais com orientação de IA." }] }),
  component: Laboratory,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

function Laboratory() {
  const [courseSlug, setCourseSlug] = useState(academyCourses[0]?.slug ?? "");
  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const course = useMemo(() => academyCourses.find((item) => item.slug === courseSlug), [courseSlug]);

  async function sendMessage(value = idea) {
    const content = value.trim();
    if (!content || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setIdea("");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("academy-mentor", {
      body: {
        course: course ? { title: course.title, area: course.area, description: course.description, outcome: course.outcome } : null,
        messages: nextMessages.slice(-16),
      },
    });
    setSending(false);
    if (error || !data?.reply) {
      setMessages((current) => current.slice(0, -1));
      setIdea(content);
      toast.error("Não foi possível conectar ao mentor", { description: error?.message || "Verifique se a função academy-mentor está configurada." });
      return;
    }
    setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
  }

  const suggestions = ["Ajude a organizar minha ideia", "Monte um plano de desenvolvimento", "Quero começar a criar um protótipo", "Revise uma decisão técnica"];

  return <main className="min-h-screen bg-[#090909] pb-28 text-white">
    <SiteHeader />
    <section className="mx-auto flex min-h-[calc(100dvh-150px)] max-w-5xl flex-col px-3 py-4 sm:px-6 sm:py-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/aprendizado" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Minha aprendizagem</Link>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Mentor de IA</span>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-white/35">Aprender fazendo</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Meu Laboratório</h1><p className="mt-2 max-w-xl text-xs leading-5 text-white/45">Traga uma ideia, dúvida ou trecho de código. O mentor ajuda a transformar o conteúdo do curso em um projeto por etapas.</p></div>
        <label className="block w-full sm:max-w-xs"><span className="mb-1.5 block text-[9px] uppercase tracking-wider text-white/35">Curso de referência</span><select value={courseSlug} onChange={(event) => setCourseSlug(event.target.value)} className="h-10 w-full border border-white/10 bg-[#151515] px-3 text-xs text-white outline-none focus:border-white/35">{academyCourses.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
      </div>
      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden border border-white/[.08] bg-[#101010]">
        <header className="flex items-center gap-3 border-b border-white/[.07] px-4 py-3">
          <span className="grid h-9 w-9 place-items-center bg-white text-black"><Sparkles size={17}/></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold">Mentor ChromaX</p><p className="mt-0.5 truncate text-[10px] text-white/40">{course?.area || "Orientação de projetos"} · {course?.title || "Projeto livre"}</p></div>
          <span className="text-[9px] text-white/30">IA</span>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          {!messages.length ? <div className="m-auto w-full max-w-xl py-8">
            <span className="mx-auto grid h-12 w-12 place-items-center bg-white/[.07] text-white/70"><Lightbulb size={22}/></span>
            <h2 className="mt-4 text-center text-lg font-semibold">O que você quer construir?</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-xs leading-6 text-white/40">O mentor considera o curso selecionado para ajudar com planejamento, arquitetura, código, design e validação. Você continua no controle das decisões.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => void sendMessage(suggestion)} className="flex min-h-11 items-center justify-between gap-2 border border-white/[.08] bg-white/[.025] px-3 py-3 text-left text-[11px] text-white/65 transition hover:bg-white/[.07] hover:text-white">{suggestion}<ArrowUp size={13}/></button>)}</div>
          </div> : <>
            {messages.map((message, index) => <div key={index} className={"flex " + (message.role === "user" ? "justify-end" : "justify-start")}>
              <div className={"max-w-[88%] whitespace-pre-wrap break-words px-4 py-3 text-xs leading-6 sm:max-w-[78%] sm:text-sm " + (message.role === "user" ? "bg-white text-black" : "border border-white/[.08] bg-[#1b1b1b] text-white/80")}>
                {message.role === "assistant" && <span className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/40"><Sparkles size={11}/> Mentor ChromaX</span>}
                {message.content}
              </div>
            </div>)}
            {sending && <div className="flex items-center gap-2 text-[11px] text-white/40"><LoaderCircle size={14} className="animate-spin"/> Pensando no próximo passo…</div>}
          </>}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="border-t border-white/[.08] p-3 sm:p-4">
          <div className="flex items-end gap-2 bg-[#1a1a1a] p-2">
            <Code2 size={17} className="mb-2 ml-1 shrink-0 text-white/35"/>
            <textarea value={idea} onChange={(event) => setIdea(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} maxLength={6000} placeholder="Descreva sua ideia, dúvida ou cole um trecho de código…" className="max-h-32 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-1 py-2 text-xs leading-5 text-white outline-none placeholder:text-white/35"/>
            <button type="submit" disabled={!idea.trim() || sending} aria-label="Enviar mensagem" className="grid h-9 w-9 shrink-0 place-items-center bg-white text-black transition hover:bg-white/85 disabled:opacity-35"><ArrowUp size={17}/></button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-white/30"><span className="inline-flex items-center gap-1"><Paperclip size={11}/> Cole código ou descreva seu projeto</span><span>{idea.length}/6000</span></div>
        </form>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/30"><span className="inline-flex items-center gap-1.5"><BookOpen size={12}/> Contexto baseado no curso selecionado</span><Link to="/feed" className="inline-flex items-center gap-1.5 hover:text-white/70">Publicar projeto <Check size={12}/></Link></div>
    </section>
  </main>;
}
