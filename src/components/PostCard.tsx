import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowBigUp, Repeat2, Users, LifeBuoy, ShoppingBag } from "lucide-react";
import { type CommunityPost } from "@/lib/community";
import { supabase } from "@/integrations/supabase/client";
import { SaveButton } from "./SaveButton";
import { useCommunity } from "./CommunityProvider";

export function PostCard({ post, repostedBy }: { post: CommunityPost; repostedBy?: string | undefined }) {
  const { user } = useCommunity();
  const qc = useQueryClient();
  const ups = post.post_ups ?? [];
  const reps = post.post_reposts ?? [];
  const [up, setUp] = useState(!!user && ups.some((u) => u.user_id === user.id));
  const [rep, setRep] = useState(!!user && reps.some((u) => u.user_id === user.id));
  const [upN, setUpN] = useState(ups.length);
  const [repN, setRepN] = useState(reps.length);
  const [pending, setPending] = useState<"up" | "rep" | null>(null);

  useEffect(() => {
    setUp(!!user && ups.some((item) => item.user_id === user.id));
    setRep(!!user && reps.some((item) => item.user_id === user.id));
    setUpN(ups.length);
    setRepN(reps.length);
  }, [user?.id, post.id, ups, reps]);
  const p = post.profiles;
  const name = p?.display_name || p?.username || "Membro chromaX";
  const own = user?.id === post.author_id;
  const KindIcon = post.kind === "ajuda" ? LifeBuoy : post.kind === "pre-venda" ? ShoppingBag : Users;

  async function toggle(kind: "up" | "rep") {
    if (!user) { toast("Entre para interagir"); return; }
    if (pending) return;
    const table = kind === "up" ? "post_ups" : "post_reposts";
    const on = kind === "up" ? up : rep;
    const set = kind === "up" ? setUp : setRep;
    const setN = kind === "up" ? setUpN : setRepN;
    setPending(kind);
    set(!on); setN((n) => Math.max(0, n + (on ? -1 : 1)));
    try {
      const { error } = on
        ? await supabase.from(table).delete().eq("user_id", user.id).eq("post_id", post.id)
        : await supabase.from(table).insert({ user_id: user.id, post_id: post.id });
      if (error) throw error;
      if (kind === "rep") toast.success(on ? "Repost removido" : "Repostado no seu perfil");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["posts"] }),
        qc.invalidateQueries({ queryKey: ["profile-activity"] }),
      ]);
    } catch {
      set(on); setN((n) => Math.max(0, n + (on ? 1 : -1)));
      toast.error("Não foi possível atualizar esta publicação");
    } finally {
      setPending(null);
    }
  }

  return <article className="border-b border-border px-5 py-6 sm:px-7">
    {repostedBy && <p className="mb-3 flex items-center gap-1.5 pl-14 text-[11px] text-muted-foreground"><Repeat2 size={13} />{repostedBy} repostou</p>}
    <div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary font-semibold">{p?.logo_url ? <img src={p.logo_url} alt={name} className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-muted-foreground">@{p?.username || "membro"} <span className="mx-1">·</span><Link to="/post/$id" params={{ id: post.id }} className="hover:underline"><time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</time></Link></p></div><SaveButton postId={post.id} /></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{post.body}</p>{post.image_url && <img src={post.image_url} alt="Imagem da publicação" loading="lazy" className="mt-4 max-h-96 w-full rounded-lg border border-border object-contain" />}
      <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
        <button disabled={pending !== null} onClick={() => toggle("up")} aria-pressed={up} aria-label="Dar up" className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-secondary disabled:cursor-wait disabled:opacity-50 ${up ? "text-accent" : ""}`}><ArrowBigUp size={18} className={up ? "fill-current" : ""} />{upN} Up</button>
        {!own && <button disabled={pending !== null} onClick={() => toggle("rep")} aria-pressed={rep} aria-label="Repostar" className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-secondary disabled:cursor-wait disabled:opacity-50 ${rep ? "text-accent" : ""}`}><Repeat2 size={16} />{repN}</button>}
        {own && <span className="inline-flex items-center gap-1 px-2"><Repeat2 size={16} />{repN}</span>}
        <span className="ml-auto flex items-center gap-1.5 text-[11px]"><KindIcon size={13} />{post.kind === "ajuda" ? "Ajuda" : post.kind === "pre-venda" ? "Pré-venda" : "Conversa"}</span>
      </div></div></div></article>;
}
