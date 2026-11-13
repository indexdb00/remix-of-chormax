import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Bookmark, Check, X, User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommunity } from "./CommunityProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { user, compose } = useCommunity();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const requests = useQuery({
    queryKey: ["incoming-friend-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("friendships").select("id,requester_id,created_at")
        .eq("addressee_id", user!.id).eq("status", "pending").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((r) => r.requester_id))];
      const profiles = ids.length ? await supabase.from("profiles").select("id,display_name,username,logo_url").in("id", ids) : { data: [], error: null };
      if (profiles.error) throw profiles.error;
      return (data ?? []).map((request) => ({ ...request, profile: profiles.data?.find((p) => p.id === request.requester_id) ?? null }));
    },
  });
  const activity = useQuery({
    queryKey: ["post-activity-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: ownPosts, error: ownError } = await supabase.from("feed_posts").select("id").eq("author_id", user!.id).limit(100);
      if (ownError) throw ownError;
      const ids = (ownPosts ?? []).map((p) => p.id);
      if (!ids.length) return [];
      const [ups, reposts] = await Promise.all([
        supabase.from("post_ups").select("post_id,user_id,created_at").in("post_id", ids).neq("user_id", user!.id).order("created_at", { ascending: false }).limit(12),
        supabase.from("post_reposts").select("post_id,user_id,created_at").in("post_id", ids).neq("user_id", user!.id).order("created_at", { ascending: false }).limit(12),
      ]);
      if (ups.error) throw ups.error;
      if (reposts.error) throw reposts.error;
      const rows = [
        ...(ups.data ?? []).map((row) => ({ ...row, kind: "up" as const })),
        ...(reposts.data ?? []).map((row) => ({ ...row, kind: "repost" as const })),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 12);
      const actorIds = [...new Set(rows.map((row) => row.user_id))];
      const profiles = actorIds.length ? await supabase.from("profiles").select("id,display_name,username").in("id", actorIds) : { data: [], error: null };
      if (profiles.error) throw profiles.error;
      return rows.map((row) => ({ ...row, profile: profiles.data?.find((p) => p.id === row.user_id) ?? null }));
    },
  });
  const count = (requests.data?.length ?? 0) + (activity.data?.length ?? 0);

  async function respond(id: string, status: "accepted" | "rejected") {
    const { error } = await supabase.from("friendships").update({ status }).eq("id", id).eq("addressee_id", user!.id);
    if (error) toast.error("Não foi possível atualizar o pedido", { description: error.message });
    else {
      toast.success(status === "accepted" ? "Conexão aceita" : "Pedido recusado");
      await qc.invalidateQueries({ queryKey: ["incoming-friend-requests", user?.id] });
      await qc.invalidateQueries({ queryKey: ["friend-count"] });
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0d11]/85 backdrop-blur-2xl">
      <div className="mx-auto grid h-[68px] max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <div className="relative flex items-center">
          {user ? <>
            <Button variant="ghost" size="icon" aria-label="Notificações" title="Notificações" onClick={() => setOpen((v) => !v)} className="relative rounded-full text-zinc-200 hover:bg-white/10 hover:text-white">
              <Bell size={20}/>
              {count > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full border border-[#0d0d11] bg-gradient-to-b from-white to-zinc-400 px-1 text-[9px] font-bold text-black">{count > 9 ? "9+" : count}</span>}
            </Button>
            {open && <div className="absolute left-0 top-12 z-50 w-[min(88vw,340px)] overflow-hidden rounded-2xl border border-white/15 bg-[#151519]/95 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><p className="text-xs font-semibold">Notificações</p><button onClick={() => setOpen(false)} className="text-[10px] text-white/50">Fechar</button></div>
              <div className="max-h-[60vh] overflow-y-auto">
                {requests.isLoading ? <p className="p-5 text-xs text-white/50">Carregando…</p> : count ? requests.data!.map((request) => {
                  const name = request.profile?.display_name || request.profile?.username || "Novo membro";
                  return <div key={request.id} className="flex items-center gap-3 border-b border-white/[.07] p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-sm">{request.profile?.logo_url ? <img src={request.profile.logo_url} alt="" className="h-full w-full object-cover"/> : name.slice(0,1).toUpperCase()}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{name}</p><p className="text-[10px] text-white/50">Quer se conectar com você</p></div>
                    <button onClick={() => respond(request.id, "accepted")} aria-label="Aceitar pedido" className="rounded-full bg-white px-2.5 py-2 text-black"><Check size={14}/></button>
                    <button onClick={() => respond(request.id, "rejected")} aria-label="Recusar pedido" className="rounded-full border border-white/20 px-2.5 py-2 text-white/70"><X size={14}/></button>
                  </div>;
                }) : null}
                {activity.data?.map((item, index) => {
                  const name = item.profile?.display_name || item.profile?.username || "Alguém";
                  return <Link key={`${item.kind}-${item.post_id}-${item.user_id}-${index}`} to="/post/$id" params={{ id: item.post_id }} onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-white/[.07] p-3 hover:bg-white/[.04]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[.05] text-xs">{item.kind === "up" ? "↑" : "↻"}</span>
                    <span className="min-w-0"><span className="block truncate text-xs font-semibold">{name} {item.kind === "up" ? "deu Up" : "repostou"} em seu post</span><span className="text-[10px] text-white/45">{new Date(item.created_at).toLocaleDateString("pt-BR")}</span></span>
                  </Link>;
                })}
                {!requests.isLoading && !activity.isLoading && count === 0 && <div className="px-5 py-10 text-center"><Bell size={22} className="mx-auto text-white/30"/><p className="mt-3 text-xs text-white/60">Você está em dia. Nenhuma notificação nova.</p></div>}
              </div>
            </div>}
          </> : <Button asChild variant="ghost" size="icon" className="rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"><Link to="/auth" aria-label="Entrar" title="Entrar"><User/></Link></Button>}
        </div>
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight text-chrome sm:text-2xl">chromaX</Link>
        <nav className="flex justify-end gap-1 sm:gap-3" aria-label="Ações rápidas">
          {user && <Button variant="ghost" size="icon" className="rounded-full text-zinc-200 hover:bg-white/10 hover:text-white" aria-label="Abrir câmera" title="Abrir câmera" onClick={() => window.dispatchEvent(new Event("chromax:open-camera"))}><Camera/></Button>}
          {user && <Button variant="ghost" size="icon" className="rounded-full text-zinc-200 hover:bg-white/10 hover:text-white" aria-label="Criar post" title="Criar post" onClick={compose}><Plus/></Button>}
          {user && <Button asChild variant="ghost" size="icon" className="rounded-full text-zinc-200 hover:bg-white/10 hover:text-white"><Link to="/salvos" aria-label="Salvos" title="Salvos"><Bookmark/></Link></Button>}
        </nav>
      </div>
    </header>
  );
}
