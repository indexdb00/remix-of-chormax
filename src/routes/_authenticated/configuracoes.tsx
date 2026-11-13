import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — chromaX" },
      { name: "description", content: "Privacidade e notificações da sua conta chromaX." },
      { property: "og:title", content: "Configurações — chromaX" },
      { property: "og:description", content: "Privacidade e notificações no chromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Config,
});

type Key = "is_private" | "show_totals" | "banner_public" | "sound_chat" | "sound_sales";

function Config() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: p } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });

  async function toggle(k: Key) {
    if (!p) return;
    const { error } = await supabase.from("profiles").update({ [k]: !p[k] } as Partial<Record<Key, boolean>>).eq("id", user.id);
    if (error) toast.error("Erro ao salvar");
    else qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const Row = ({ k, title, desc }: { k: Key; title: string; desc: string }) => (
    <button onClick={() => toggle(k)} className="flex w-full items-center justify-between gap-4 border-b border-border px-5 py-4 text-left">
      <span><span className="block text-sm font-medium">{title}</span><span className="text-xs text-muted-foreground">{desc}</span></span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${p?.[k] ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${p?.[k] ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );

  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-xl">
        <Link to="/perfil" className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground"><ArrowLeft size={16} /> Perfil</Link>
        <h1 className="px-5 pb-2 text-xl font-bold">Configurações</h1>
        <p className="px-5 pt-4 text-xs uppercase tracking-wider text-muted-foreground">Privacidade</p>
        <Row k="is_private" title="Conta privada" desc="Só amigos veem suas publicações no perfil." />
        <Row k="show_totals" title="Mostrar estatísticas no perfil" desc="Controla a exibição dos totais comerciais no perfil." />
        <Row k="banner_public" title="Banner público" desc="Quando desligado, só você vê seu banner." />
        <p className="px-5 pt-6 text-xs uppercase tracking-wider text-muted-foreground">Notificações</p>
        <Row k="sound_chat" title="Som de mensagens" desc="Toca um aviso ao receber mensagens no chat." />
        <Row k="sound_sales" title="Som de vendas" desc="Toca um aviso quando você vender algo." />
        <button onClick={signOut} className="mt-8 flex items-center gap-2 px-5 text-sm text-destructive"><LogOut size={16} /> Sair da conta</button>
      </section>
    </main>
  );
}
