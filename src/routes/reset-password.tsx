import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — chromaX" }, { name: "description", content: "Recupere o acesso à sua conta chromaX." }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setRecovery(window.location.hash.includes("type=recovery"));
    sync();
    window.addEventListener("hashchange", sync);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => { window.removeEventListener("hashchange", sync); data.subscription.unsubscribe(); };
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/reset-password" });
      if (error) throw error;
      toast.success("Se esse e-mail estiver cadastrado, enviaremos um link de recuperação.");
    } catch (error) {
      toast.error("Não foi possível solicitar a recuperação", { description: (error as Error).message });
    } finally { setBusy(false); }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      toast.error("Use 8+ caracteres, com maiúscula, minúscula, número e símbolo.");
      return;
    }
    if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada. Entre novamente.");
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error("Não foi possível atualizar a senha", { description: (error as Error).message });
    } finally { setBusy(false); }
  }

  const input = "w-full border border-border bg-card px-4 py-3 font-mono text-sm outline-none focus:border-primary";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-md px-5 py-12">
        <p className="font-mono text-sm text-accent">[ CONTA ]</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase">{recovery ? "Nova senha" : "Recuperar acesso"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{recovery ? "Defina uma nova senha segura para sua conta." : "Informe seu e-mail e enviaremos um link para redefinir sua senha."}</p>
        {recovery ? (
          <form onSubmit={savePassword} className="mt-8 space-y-3">
            <input className={input} type="password" minLength={8} required autoComplete="new-password" placeholder="Nova senha" value={password} onChange={e => setPassword(e.target.value)} />
            <input className={input} type="password" minLength={8} required autoComplete="new-password" placeholder="Confirme a nova senha" value={confirm} onChange={e => setConfirm(e.target.value)} />
            <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.</p>
            <button disabled={busy} className="w-full bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground disabled:opacity-50">{busy ? "Salvando..." : "Salvar nova senha"}</button>
          </form>
        ) : (
          <form onSubmit={requestReset} className="mt-8 space-y-3">
            <input className={input} type="email" required autoComplete="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button disabled={busy} className="w-full bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground disabled:opacity-50">{busy ? "Enviando..." : "Enviar link de recuperação"}</button>
          </form>
        )}
        <Link to="/auth" className="mt-6 inline-block font-mono text-xs uppercase text-muted-foreground hover:text-foreground">Voltar para entrar</Link>
      </section>
    </main>
  );
}
