import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader } from "@/components/SiteHeader";
import { ArrowUpRight, ChevronLeft, ChevronRight, Code2, Layers3, Network, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — chromaX" },
      { name: "description", content: "Entre ou crie sua conta no chromaX." },
      { property: "og:title", content: "Entrar — chromaX" },
      { property: "og:description", content: "Acesse sua comunidade de projetos digitais no chromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const G = () => (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

const slides = [
  { eyebrow: "NETWORK DEV", title: "Conecte-se ao\nuniverso dev.", copy: "Encontre pessoas, troque ideias e construa conexões que fazem seus projetos avançarem.", icon: Network, tag: "Comunidade em movimento" },
  { eyebrow: "SEUS PROJETOS, EM DESTAQUE", title: "Mostre o que\nvocê está criando.", copy: "Publique projetos digitais, compartilhe atualizações e descubra o trabalho de outros criadores.", icon: Layers3, tag: "Feed • Explorar • Publicações" },
  { eyebrow: "MARKETPLACE DIGITAL", title: "Transforme ideias\nem oportunidades.", copy: "Apresente produtos e ativos digitais, descubra soluções e encontre novas possibilidades.", icon: Code2, tag: "Criação • Descoberta • Negócios" },
];

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/perfil", replace: true }));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/perfil", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((value) => (value + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("E-mail ou senha incorretos");
    } else {
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        toast.error("Use 8+ caracteres, com maiúscula, minúscula, número e símbolo.");
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) toast.error(error.message);
      else toast.success("Conta criada! Confira seu e-mail para confirmar.");
    }
    setBusy(false);
  }

  async function google() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) {
        console.error("[Google OAuth]", result.error);
        toast.error("Não foi possível entrar com Google. Tente novamente.");
        setBusy(false);
      }
    } catch (error) {
      console.error("[Google OAuth] Erro inesperado:", error);
      toast.error("Falha ao conectar com o Google. Tente novamente.");
      setBusy(false);
    }
  }

  const slide = slides[activeSlide];
  const SlideIcon = slide.icon;

  return (
    <main className="auth-expo min-h-screen overflow-hidden bg-[#08090d] font-sans text-white">
      <style>{`
        .auth-expo { background-image: radial-gradient(ellipse at 50% 0%, rgba(145,155,174,.17), transparent 48%), radial-gradient(ellipse at 100% 55%, rgba(89,103,130,.12), transparent 38%); }
        .auth-stage { position:relative; isolation:isolate; }
        .auth-stage:before { content:""; position:absolute; inset:7% 10%; z-index:-1; background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(120,130,150,.015) 48%,rgba(255,255,255,.07)); filter:blur(42px); border-radius:50%; }
        .chrome-orb { background:linear-gradient(135deg,#fff 0%,#9da5b1 17%,#343b48 32%,#e9edf3 48%,#737e8d 62%,#f8fafc 77%,#555e6c 100%); background-size:240% 240%; animation:chromeFlow 9s ease-in-out infinite; box-shadow:inset -12px -14px 24px rgba(0,0,0,.45),inset 8px 8px 18px rgba(255,255,255,.5),0 22px 65px rgba(0,0,0,.55); }
        @keyframes chromeFlow { 0%,100%{background-position:0% 20%;transform:rotate(-8deg)} 50%{background-position:100% 80%;transform:rotate(8deg)} }
        .auth-glass { background:linear-gradient(135deg,rgba(255,255,255,.105),rgba(255,255,255,.035)); border:1px solid rgba(255,255,255,.17); box-shadow:0 24px 80px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.16); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); }
        .auth-field { background:rgba(5,7,11,.42); border:1px solid rgba(255,255,255,.13); color:#fff; transition:border-color .2s,background .2s,box-shadow .2s; }
        .auth-field:focus { border-color:rgba(226,232,240,.7); background:rgba(5,7,11,.62); box-shadow:0 0 0 3px rgba(203,213,225,.09); }
        .auth-field::placeholder { color:rgba(226,232,240,.43); }
        .auth-slide-in { animation:authSlide .55s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes authSlide { from{opacity:0;transform:translateY(13px) scale(.985)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media(prefers-reduced-motion:reduce){.chrome-orb,.auth-slide-in{animation:none!important}}
      `}</style>
      <SiteHeader />
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-14 pt-8 sm:pt-12">
        <div className="auth-stage flex min-h-[310px] w-full max-w-3xl flex-col items-center justify-center overflow-hidden rounded-[30px] px-5 py-9 text-center sm:min-h-[350px]">
          <div className="pointer-events-none absolute left-[12%] top-[18%] h-24 w-24 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-[12%] right-[13%] h-16 w-16 rotate-45 border border-white/10" />
          <div className="chrome-orb mb-6 h-14 w-14 rounded-[17px] sm:h-[68px] sm:w-[68px]" />
          <div key={activeSlide} className="auth-slide-in relative z-10 flex max-w-2xl flex-col items-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.055] px-3 py-1.5 font-mono text-[10px] tracking-[.22em] text-slate-300">
              <Sparkles size={12} /> {slide.eyebrow}
            </span>
            <h1 className="whitespace-pre-line font-display text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl">{slide.title}</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">{slide.copy}</p>
            <div className="mt-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[.16em] text-slate-400">
              <SlideIcon size={14} /> {slide.tag}
            </div>
          </div>
          <div className="relative z-10 mt-7 flex items-center gap-4">
            <button type="button" aria-label="Slide anterior" onClick={() => setActiveSlide((activeSlide + slides.length - 1) % slides.length)} className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:bg-white/10"><ChevronLeft size={15}/></button>
            <div className="flex items-center gap-2" aria-label={`Slide ${activeSlide + 1} de ${slides.length}`}>
              {slides.map((_, index) => <button key={index} type="button" aria-label={`Ir para slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-7 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"}`} />)}
            </div>
            <button type="button" aria-label="Próximo slide" onClick={() => setActiveSlide((activeSlide + 1) % slides.length)} className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:bg-white/10"><ChevronRight size={15}/></button>
          </div>
        </div>

        <div className="auth-glass mt-2 w-full max-w-md rounded-[28px] p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[.2em] text-slate-400">CHROMAX / {mode === "in" ? "ACESSO" : "REGISTRO"}</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{mode === "in" ? "Bem-vindo de volta." : "Entre para a rede."}</h2>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[.07] p-3 text-slate-200"><ArrowUpRight size={19}/></div>
          </div>

          <button onClick={google} disabled={busy} className="flex w-full items-center justify-center gap-[10px] rounded-xl border border-white/20 bg-white/[.07] px-3 py-3 text-sm font-medium text-white transition hover:bg-white/[.13] disabled:cursor-not-allowed disabled:opacity-50">
            <G /> {busy ? "Conectando..." : "Continuar com Google"}
          </button>
          <div className="my-5 flex items-center gap-3 font-mono text-[10px] tracking-[.18em] text-slate-500"><span className="h-px flex-1 bg-white/15" />OU COM E-MAIL<span className="h-px flex-1 bg-white/15" /></div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[.14em] text-slate-400">E-MAIL</span>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="auth-field w-full rounded-xl px-4 py-3.5 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[.14em] text-slate-400">SENHA</span>
              <input type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={mode === "up" ? 8 : 6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" className="auth-field w-full rounded-xl px-4 py-3.5 text-sm outline-none" />
            </label>
            {mode === "up" && <p className="px-1 text-xs leading-5 text-slate-400">Use 8+ caracteres, com maiúscula, minúscula, número e símbolo.</p>}
            {mode === "in" && <div className="text-right"><Link to="/reset-password" className="font-mono text-[10px] tracking-wide text-slate-400 transition hover:text-white">Esqueceu sua senha?</Link></div>}
            <button disabled={busy} className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-100 via-white to-slate-300 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[.16em] text-[#11141a] shadow-[0_8px_30px_rgba(220,226,236,.12)] transition hover:brightness-110 disabled:opacity-50">
              {busy ? "Aguarde..." : mode === "in" ? "Entrar na chromaX" : "Criar minha conta"} <ArrowUpRight size={15} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
            </button>
          </form>

          <div className="mt-5 border-t border-white/10 pt-4 text-center">
            <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-400 transition hover:text-white">
              {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>
        <p className="mt-5 text-center font-mono text-[9px] tracking-[.2em] text-slate-600">CREATE • CONNECT • TRADE • CHROMAX</p>
      </section>
    </main>
  );
}
