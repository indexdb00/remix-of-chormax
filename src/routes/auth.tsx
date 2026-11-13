import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — chromaX" },
      { name: "description", content: "Entre ou crie sua conta no chromaX." },
      { property: "og:title", content: "Entrar — chromaX" },
      { property: "og:description", content: "Acesse sua conta no marketplace chromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const G = () => (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/perfil", replace: true }));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/perfil", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("E-mail ou senha incorretos");
    } else {
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        console.error("[Google OAuth] Não foi possível iniciar a autenticação:", error);
        toast.error(error.message || "Não foi possível entrar com Google. Tente novamente.");
        setBusy(false);
      }
      // Em caso de sucesso, o Supabase redireciona o navegador para o Google.
    } catch (error) {
      console.error("[Google OAuth] Erro inesperado:", error);
      toast.error("Falha ao conectar com o Google. Verifique sua conexão e tente novamente.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-md px-5 py-12">
        <p className="font-mono text-sm text-accent">[ {mode === "in" ? "ACESSO" : "NOVA CONTA"} ]</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase">{mode === "in" ? "Entrar" : "Criar conta"}</h1>

        <button onClick={google} disabled={busy} className="mt-8 flex w-full items-center justify-center gap-[10px] rounded-full border border-[#8E918F] bg-[#131314] px-3 py-2.5 text-sm font-medium text-[#E3E3E3] disabled:cursor-not-allowed disabled:opacity-50">
          <G /> {busy ? "Conectando..." : "Continuar com Google"}
        </button>

        <div className="my-6 flex items-center gap-3 font-mono text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OU<span className="h-px flex-1 bg-border" /></div>

        <form onSubmit={submit} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="w-full border border-border bg-card px-4 py-3 font-mono text-sm outline-none focus:border-primary" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full border border-border bg-card px-4 py-3 font-mono text-sm outline-none focus:border-primary" />
          <button disabled={busy} className="w-full bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground hover:bg-foreground disabled:opacity-50">
            {busy ? "..." : mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 font-mono text-xs uppercase text-muted-foreground hover:text-foreground">
          {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>
      </section>
    </main>
  );
}
