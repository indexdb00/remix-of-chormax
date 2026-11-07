import { Bookmark } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCommunity } from "./CommunityProvider";
import { supabase } from "@/integrations/supabase/client";

export function SaveButton({ postId, productId }: { postId?: string; productId?: string }) {
  const { user } = useCommunity();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: saved } = useQuery({ queryKey: ["saved", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from("saved_items").select("*").eq("user_id", user.id);
    if (error) throw error;
    return data;
  } });
  const row = saved?.find((s) => postId ? s.post_id === postId : s.product_id === productId);
  async function toggle() {
    if (!user) { toast.info("Entre na sua conta para salvar"); return; }
    setBusy(true);
    const result = row ? await supabase.from("saved_items").delete().eq("id", row.id) : await supabase.from("saved_items").insert({ user_id: user.id, post_id: postId ?? null, product_id: productId ?? null });
    if (result.error) toast.error("Não foi possível salvar");
    else { await qc.invalidateQueries({ queryKey: ["saved"] }); await qc.invalidateQueries({ queryKey: ["saved-content"] }); }
    setBusy(false);
  }
  return <Button variant="ghost" size="icon" disabled={busy} onClick={toggle} aria-label={row ? "Remover dos salvos" : "Salvar"} title={row ? "Remover dos salvos" : "Salvar"} className="rounded-full hover:bg-secondary hover:text-foreground"><Bookmark className={row ? "fill-primary text-primary" : "text-muted-foreground"} /></Button>;
}