import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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


  const slide = slides[activeSlide];
  const voxelPositions = [[42,5],[62,18],[22,25],[43,39],[82,43],[4,49],[63,61],[24,72],[44,83],[83,85],[3,8],[103,28]];
  const SlideIcon = slide.icon;

  return (
    <main className="auth-expo min-h-screen overflow-hidden bg-[#08090d] font-sans text-white">
      <style>{`

        .auth-expo { height:100svh; background-image:radial-gradient(ellipse at 48% 10%,rgba(177,190,210,.16),transparent 42%),radial-gradient(ellipse at 95% 75%,rgba(89,103,130,.13),transparent 38%); }
        .auth-layout { height:calc(100svh - 64px); min-height:496px; max-height:920px; }
        .auth-stage { position:relative; isolation:isolate; flex:0 0 clamp(174px,27svh,252px); }
        .auth-stage:before { content:""; position:absolute; inset:7% 10%; z-index:-1; background:linear-gradient(135deg,rgba(255,255,255,.15),rgba(120,130,150,.015) 48%,rgba(255,255,255,.08)); filter:blur(42px); border-radius:50%; }
        .voxel-scene { position:relative; width:clamp(116px,19vw,190px); height:clamp(116px,19vw,190px); flex:none; perspective:700px; filter:drop-shadow(0 18px 28px rgba(0,0,0,.48)); }
        .voxel-cube { position:absolute; width:clamp(25px,4.1vw,42px); height:clamp(25px,4.1vw,42px); border-radius:5px; transform:rotateX(55deg) rotateZ(45deg); background:linear-gradient(145deg,#fff 0%,#bfc6d0 18%,#515b69 39%,#e9edf4 56%,#7b8797 73%,#f8fafc 88%,#566170 100%); background-size:220% 220%; box-shadow:inset 2px 2px 5px rgba(255,255,255,.8),inset -5px -6px 9px rgba(0,0,0,.48),0 8px 15px rgba(0,0,0,.32); animation:voxelShine 6s ease-in-out infinite; }
        .voxel-cube:before,.voxel-cube:after { content:""; position:absolute; inset:0; border-radius:4px; }
        .voxel-cube:before { transform:translate(7px,7px); background:linear-gradient(145deg,#7f8998,#222a35 70%,#aeb7c4); z-index:-1; filter:brightness(.8); }
        .voxel-cube:after { inset:3px; border:1px solid rgba(255,255,255,.32); }
        .voxel-cube:nth-child(3n) { animation-delay:-2s; } .voxel-cube:nth-child(4n) { animation-delay:-4s; }
        @keyframes voxelShine { 0%,100%{background-position:0% 30%;filter:brightness(.88);transform:rotateX(55deg) rotateZ(45deg) translateY(0)} 50%{background-position:100% 70%;filter:brightness(1.2);transform:rotateX(55deg) rotateZ(45deg) translateY(-5px)} }
        .auth-glass { background:linear-gradient(135deg,rgba(255,255,255,.115),rgba(255,255,255,.035)); border:1px solid rgba(255,255,255,.19); box-shadow:0 20px 65px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.18); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); }
        .auth-field { background:rgba(5,7,11,.42); border:1px solid rgba(255,255,255,.15); color:#fff; transition:border-color .2s,background .2s,box-shadow .2s; }
        .auth-field:focus { border-color:rgba(226,232,240,.78); background:rgba(5,7,11,.62); box-shadow:0 0 0 3px rgba(203,213,225,.09); }
        .auth-field::placeholder { color:rgba(226,232,240,.43); }
        .auth-slide-in { animation:authSlide .55s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes authSlide { from{opacity:0;transform:translateY(13px) scale(.985)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media(max-height:720px){.auth-layout{min-height:0;padding-top:4px;padding-bottom:4px;gap:6px}.auth-stage{flex-basis:clamp(142px,23svh,180px)}.auth-glass{padding:12px 18px!important}.auth-glass-head{margin-bottom:8px!important}.auth-divider{margin-top:9px!important;margin-bottom:9px!important}.auth-form{gap:7px!important}.auth-label{margin-bottom:3px!important}.auth-input{padding-top:9px!important;padding-bottom:9px!important}.auth-switch{margin-top:9px!important;padding-top:8px!important}.auth-footer{display:none!important}}
        @media(max-width:640px){.auth-layout{height:calc(100svh - 56px);min-height:0;justify-content:center;gap:5px;padding:4px 12px}.auth-stage{flex:0 0 clamp(112px,19svh,150px);padding:5px 8px 17px;gap:10px;border-radius:20px}.voxel-scene{width:76px;height:76px}.voxel-cube{width:21px;height:21px}.auth-stage-copy{max-width:calc(100% - 82px)}.auth-stage-copy>span{margin-bottom:5px;padding:4px 7px;font-size:8px;letter-spacing:.14em}.auth-stage-copy h1{font-size:clamp(20px,6vw,28px);line-height:1.05}.auth-stage-copy p{margin-top:5px;font-size:10px;line-height:1.3}.auth-stage-copy .auth-tag{margin-top:5px;font-size:8px}.auth-stage>div[aria-label^="Slide"]{bottom:4px;right:9px;gap:7px}.auth-stage>button{padding:5px}.auth-glass{padding:11px 13px!important;border-radius:19px}.auth-glass-head{margin-bottom:7px!important}.auth-glass h2{font-size:17px}.auth-glass-head>div:last-child{padding:8px}.auth-form{gap:6px!important}.auth-label{font-size:9px!important}.auth-input{padding:8px 11px!important;font-size:12px!important;border-radius:9px!important}.auth-form>button{margin-top:1px;padding:10px 12px;font-size:10px}.auth-switch{margin-top:7px!important;padding-top:7px!important}.auth-divider{display:none!important}.auth-footer{display:none!important}}\n        @media(max-height:760px) and (max-width:640px){.auth-layout{gap:4px}.auth-stage{flex-basis:clamp(100px,16svh,124px)}.voxel-scene{width:66px;height:66px}.voxel-cube{width:18px;height:18px}.auth-stage-copy h1{font-size:clamp(18px,5.6vw,24px)}.auth-stage-copy p{font-size:9px;line-height:1.22}.auth-glass{padding:9px 12px!important}.auth-glass-head{margin-bottom:5px!important}.auth-form{gap:5px!important}.auth-input{padding-top:7px!important;padding-bottom:7px!important}.auth-switch{margin-top:5px!important;padding-top:5px!important}}
        @media(prefers-reduced-motion:reduce){.chrome-orb,.auth-slide-in{animation:none!important}}
      `}</style>
      <SiteHeader />
      <section className="auth-layout mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-4 py-2 sm:px-6">
        <div className="auth-stage flex w-full max-w-4xl items-center justify-center gap-3 overflow-hidden rounded-[28px] px-4 py-3 sm:gap-8 sm:px-8">
          <div className="pointer-events-none absolute left-[12%] top-[18%] h-24 w-24 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-[12%] right-[13%] h-16 w-16 rotate-45 border border-white/10" />
          <div className="voxel-scene" aria-hidden="true">{voxelPositions.map(([left, top], index) => <span key={index} className="voxel-cube" style={{ left: left + "%", top: top + "%", zIndex: index % 3 }} />)}</div>
          <div key={activeSlide} className="auth-stage-copy auth-slide-in relative z-10 flex max-w-xl flex-col items-start text-left">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.055] px-3 py-1.5 font-mono text-[10px] tracking-[.22em] text-slate-300">
              <Sparkles size={12} /> {slide.eyebrow}
            </span>
            <h1 className="whitespace-pre-line font-display text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl">{slide.title}</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">{slide.copy}</p>
            <div className="auth-tag mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[.16em] text-slate-400">
              <SlideIcon size={14} /> {slide.tag}
            </div>
          </div>
          <div className="absolute bottom-3 right-5 z-10 flex items-center gap-3 sm:bottom-4 sm:right-8">
            <button type="button" aria-label="Slide anterior" onClick={() => setActiveSlide((activeSlide + slides.length - 1) % slides.length)} className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:bg-white/10"><ChevronLeft size={15}/></button>
            <div className="flex items-center gap-2" aria-label={`Slide ${activeSlide + 1} de ${slides.length}`}>
              {slides.map((_, index) => <button key={index} type="button" aria-label={`Ir para slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-7 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"}`} />)}
            </div>
            <button type="button" aria-label="Próximo slide" onClick={() => setActiveSlide((activeSlide + 1) % slides.length)} className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:bg-white/10"><ChevronRight size={15}/></button>
          </div>
        </div>

        <div className="auth-glass w-full max-w-md shrink-0 rounded-[25px] p-4 sm:p-5">
          <div className="auth-glass-head mb-3 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[.2em] text-slate-400">CHROMAX / {mode === "in" ? "ACESSO" : "REGISTRO"}</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{mode === "in" ? "Bem-vindo de volta." : "Entre para a rede."}</h2>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[.07] p-3 text-slate-200"><ArrowUpRight size={19}/></div>
          </div>

          <form onSubmit={submit} className="auth-form space-y-2">
            <label className="block">
              <span className="auth-label mb-1 block font-mono text-[10px] tracking-[.14em] text-slate-400">E-MAIL</span>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="auth-field auth-input w-full rounded-xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="auth-label mb-1 block font-mono text-[10px] tracking-[.14em] text-slate-400">SENHA</span>
              <input type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={mode === "up" ? 8 : 6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" className="auth-field auth-input w-full rounded-xl px-4 py-3 text-sm outline-none" />
            </label>
            {mode === "up" && <p className="px-1 text-xs leading-5 text-slate-400">Use 8+ caracteres, com maiúscula, minúscula, número e símbolo.</p>}
            {mode === "in" && <div className="text-right"><Link to="/reset-password" className="font-mono text-[10px] tracking-wide text-slate-400 transition hover:text-white">Esqueceu sua senha?</Link></div>}
            <button disabled={busy} className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-100 via-white to-slate-300 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[.16em] text-[#11141a] shadow-[0_8px_30px_rgba(220,226,236,.12)] transition hover:brightness-110 disabled:opacity-50">
              {busy ? "Aguarde..." : mode === "in" ? "Entrar na chromaX" : "Criar minha conta"} <ArrowUpRight size={15} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
            </button>
          </form>

          <div className="auth-switch mt-3 border-t border-white/10 pt-3 text-center">
            <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-400 transition hover:text-white">
              {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>
        <p className="auth-footer mt-2 text-center font-mono text-[9px] tracking-[.2em] text-slate-600">CREATE • CONNECT • TRADE • CHROMAX</p>
      </section>
    </main>
  );
}
