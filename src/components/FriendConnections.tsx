import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCommunity } from "./CommunityProvider";
export function FriendConnections() {
  const { user } = useCommunity();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isError } = useQuery({ queryKey: ["connections", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return { profiles: [], friendships: [] };
    const [profiles, friendships] = await Promise.all([supabase.from("profiles").select("id,display_name,username,logo_url").neq("id", user.id).limit(12), supabase.from("friendships").select("*").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)]);
    if (profiles.error) throw profiles.error;
    if (friendships.error) throw friendships.error;
    return { profiles: profiles.data, friendships: friendships.data };
  } });
  async function act(id: string, action: "request" | "accept" | "remove", rowId?: string) {
    if (!user) return;
    setBusy(id);
    const result = action === "request" ? await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: id, status: "pending" }) : action === "accept" ? await supabase.from("friendships").update({ status: "accepted" }).eq("id", rowId ?? "") : await supabase.from("friendships").delete().eq("id", rowId ?? "");
    if (result.error) toast.error("Não foi possível atualizar a amizade");
    else { await qc.invalidateQueries({ queryKey: ["connections"] }); await qc.invalidateQueries({ queryKey: ["posts", "friends"] }); }
    setBusy(null);
  }
  if (!user) return null;
  return <section className="py-6"><h2 className="mb-5 text-sm font-semibold">Conexões</h2>{isError ? <p className="text-xs text-muted-foreground">Não foi possível carregar as conexões.</p> : !data?.profiles.length ? <p className="text-xs leading-6 text-muted-foreground">Novos membros aparecerão por aqui.</p> : <div className="space-y-5">{data.profiles.map((p) => {
    const row = data.friendships.find((r) => r.requester_id === p.id || r.addressee_id === p.id);
    const incoming = row?.status === "pending" && row.addressee_id === user.id;
    return <div key={p.id} className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs">{p.logo_url ? <img src={p.logo_url} alt="" className="h-full w-full object-cover" /> : (p.display_name || "?").slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{p.display_name || p.username || "Membro"}</p><p className="text-[10px] text-muted-foreground">{row?.status === "accepted" ? "Amigos" : incoming ? "Pedido de amizade" : row ? "Pedido enviado" : `@${p.username || "membro"}`}</p></div>{!row && <Button variant="secondary" size="icon" aria-label={`Adicionar ${p.display_name || "membro"}`} title="Adicionar amigo" disabled={busy === p.id} onClick={() => act(p.id, "request")}><UserPlus /></Button>}{incoming && <Button variant="secondary" size="icon" aria-label={`Aceitar ${p.display_name || "membro"}`} title="Aceitar amizade" disabled={busy === p.id} onClick={() => act(p.id, "accept", row.id)}><Check /></Button>}{row && <Button variant="ghost" size="icon" aria-label={row.status === "accepted" ? "Remover amizade" : "Cancelar pedido"} title={row.status === "accepted" ? "Remover amizade" : "Cancelar pedido"} disabled={busy === p.id} onClick={() => act(p.id, "remove", row.id)}><X /></Button>}</div>;
  })}</div>}</section>;
}