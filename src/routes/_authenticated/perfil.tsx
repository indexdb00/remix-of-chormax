import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — chromaX" },
      { name: "description", content: "Gerencie seu perfil no chromaX." },
      { property: "og:title", content: "Meu perfil — chromaX" },
      { property: "og:description", content: "Sua área de usuário no chromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const [form, setForm] = useState({ display_name: "", username: "", bio: "" });
  useEffect(() => {
    if (profile) setForm({ display_name: profile.display_name ?? "", username: profile.username ?? "", bio: profile.bio ?? "" });
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const username = form.username.trim().toLowerCase() || null;
    const { error } = await supabase.from("profiles").update({ display_name: form.display_name.trim(), username, bio: form.bio.trim() }).eq("id", user.id);
    if (error) toast.error(error.code === "23505" ? "Esse usuário já existe" : "Erro ao salvar");
    else { toast.success("Perfil salvo"); qc.invalidateQueries({ queryKey: ["profile", user.id] }); }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const input = "w-full border border-border bg-card px-4 py-3 font-mono text-sm outline-none focus:border-primary";
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-5 py-10">
        <p className="font-mono text-sm text-accent">[ PERFIL ]</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase">{form.display_name || "Sem nome"}</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{user.email}</p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[["Inventário", "0"], ["Vendas", "0"], ["Nível", "1"]].map(([l, v]) => (
            <div key={l} className="border border-border bg-card p-4">
              <p className="font-mono text-xs uppercase text-muted-foreground">{l}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-chrome">{v}</p>
            </div>
          ))}
        </div>

        <form onSubmit={save} className="mt-8 space-y-3">
          <label className="block font-mono text-xs uppercase text-muted-foreground">Nome
            <input className={`${input} mt-1`} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} maxLength={60} />
          </label>
          <label className="block font-mono text-xs uppercase text-muted-foreground">Usuário
            <input className={`${input} mt-1`} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, "") })} maxLength={30} placeholder="seu_usuario" />
          </label>
          <label className="block font-mono text-xs uppercase text-muted-foreground">Bio
            <textarea className={`${input} mt-1`} rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={280} />
          </label>
          <button className="bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground hover:bg-foreground">Salvar</button>
        </form>

        <button onClick={signOut} className="mt-10 inline-flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground hover:text-destructive">
          <LogOut size={14} /> Sair
        </button>
      </section>
    </main>
  );
}
