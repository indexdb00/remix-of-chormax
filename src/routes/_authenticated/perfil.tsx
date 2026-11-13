import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, ArrowBigUp, BadgeCheck, Repeat2, Camera, Grid3x3, MessageSquare, Package, Pencil, Settings, Trash2, Undo2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { uploadMedia } from "@/lib/media";
import { PostCard } from "@/components/PostCard";
import { POST_SELECT, type CommunityPost } from "@/lib/community";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — chromaX" },
      { name: "description", content: "Seu perfil, posts e produtos no chromaX." },
      { property: "og:title", content: "Meu perfil — chromaX" },
      { property: "og:description", content: "Sua área de usuário no chromaX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Perfil,
});

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const DAY = 86400000;

function Perfil() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"produtos" | "posts" | "reposts" | "ups" | "arquivados">("posts");
  const [editing, setEditing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["my-products", user.id],
    queryFn: async () => (await supabase.from("products").select("id,name,slug,price_cents,images,sales").eq("creator_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["my-posts", user.id],
    queryFn: async () => (await supabase.from("feed_posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: friends = 0 } = useQuery({
    queryKey: ["friend-count", user.id],
    queryFn: async () => (await supabase.from("friendships").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)).count ?? 0,
  });

  const { data: activity = { reposts: [], ups: [] } } = useQuery({
    queryKey: ["profile-activity", user.id],
    queryFn: async () => {
      const [r, u] = await Promise.all([
        supabase.from("post_reposts").select("post_id").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("post_ups").select("post_id").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      const load = async (ids: string[]) => ids.length ? ((await supabase.from("feed_posts").select(POST_SELECT).in("id", ids)).data ?? []) as unknown as CommunityPost[] : [];
      return { reposts: await load((r.data ?? []).map((x) => x.post_id)), ups: await load((u.data ?? []).map((x) => x.post_id)) };
    },
  });

  const { data: upsReceived = 0 } = useQuery({
    queryKey: ["ups-received", user.id],
    queryFn: async () => {
      const ids = (await supabase.from("feed_posts").select("id").eq("author_id", user.id)).data?.map((x) => x.id) ?? [];
      if (!ids.length) return 0;
      return (await supabase.from("post_ups").select("post_id", { count: "exact", head: true }).in("post_id", ids)).count ?? 0;
    },
  });
  const isCreator = products.length > 0;
  const active = posts.filter((p) => !p.archived);
  const archived = posts.filter((p) => p.archived);
  const refreshPosts = () => qc.invalidateQueries({ queryKey: ["my-posts", user.id] }).then(() => qc.invalidateQueries({ queryKey: ["posts"] }));

  async function setArchived(id: string, v: boolean) {
    const { error } = await supabase.from("feed_posts").update({ archived: v }).eq("id", id);
    if (error) toast.error("Erro"); else { toast.success(v ? "Arquivado" : "Restaurado"); refreshPosts(); }
  }
  async function remove(id: string) {
    if (!confirm("Apagar este post?")) return;
    await supabase.from("saved_items").delete().eq("post_id", id);
    const { error } = await supabase.from("feed_posts").delete().eq("id", id);
    if (error) toast.error("Erro"); else { toast.success("Post apagado"); refreshPosts(); }
  }

  const name = profile?.display_name || "Sem nome";

  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl">
        <div className="px-4 pt-6 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-card sm:h-28 sm:w-28">
              {profile?.logo_url ? <img src={profile.logo_url} alt={name} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-3xl font-bold">{name[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex gap-2 pb-1">
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-gradient-to-b from-white/[0.14] to-white/[0.04] px-4 py-2.5 text-xs font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.16)] transition hover:border-white/40 hover:from-white/[0.2]"><Pencil size={14} /> Editar perfil</button>
              <Link to="/creator" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"><Package size={14} /> Creator</Link>
              <Link to="/configuracoes" aria-label="Configurações" className="rounded-lg border border-border bg-card p-2"><Settings size={16} /></Link>
            </div>
          </div>

          <div className="mt-3">
            <h1 className="flex items-center gap-1.5 text-lg font-bold">
              {name}
              {isCreator && <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent"><BadgeCheck size={12} /> Creator</span>}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile?.username || "sem_usuario"}</p>
            {profile?.bio && <p className="mt-2 whitespace-pre-wrap text-sm">{profile.bio}</p>}
          </div>

          <div className="mt-5 grid grid-cols-3 border-y border-border py-3 text-center">
            {[["Posts", active.length], ["Ups recebidos", upsReceived], ["Amigos", friends]].map(([l, v]) => (
              <div key={l as string}><p className="text-base font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
            ))}
          </div>
          {profile?.show_totals !== false && <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">Total comprado</p><p className="font-bold">{brl(profile?.total_bought_cents ?? 0)}</p></div>
            <div className="rounded-xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">Total vendido</p><p className="font-bold">{brl(profile?.total_sold_cents ?? 0)}</p></div>
          </div>}
        </div>

        <div className="mt-5 grid grid-cols-5 border-b border-border">
          {([["posts", MessageSquare, "Posts"], ["reposts", Repeat2, "Reposts"], ["ups", ArrowBigUp, "Ups"], ["produtos", Grid3x3, "Produtos"], ["arquivados", Archive, "Arquivo"]] as const).map(([k, I, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] sm:flex-row sm:text-xs ${tab === k ? "border-b-2 border-foreground font-semibold" : "text-muted-foreground"}`}><I size={15} /> {l}</button>
          ))}
        </div>

        {tab === "produtos" && (
          products.length ? (
            <div className="grid grid-cols-3 gap-0.5">
              {products.map((p) => (
                <Link key={p.id} to="/produto/$slug" params={{ slug: p.slug }} className="relative aspect-square overflow-hidden bg-card">
                  {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center"><Package className="text-muted-foreground" /></span>}
                  <span className="absolute bottom-1 left-1 rounded bg-background/75 px-1.5 text-[10px] font-semibold">{brl(p.price_cents)}</span>
                </Link>
              ))}
            </div>
          ) : <Empty text="Nenhum produto ainda." cta />
        )}

        {(tab === "reposts" || tab === "ups") && (
          activity[tab].length ? <div>{activity[tab].map((p) => <PostCard key={p.id} post={p} repostedBy={tab === "reposts" ? "Você" : undefined} />)}</div>
            : <Empty text={tab === "reposts" ? "Você ainda não repostou nada." : "Você ainda não deu Up em nenhum post."} />
        )}

        {(tab === "posts" || tab === "arquivados") && (
          (tab === "posts" ? active : archived).length ? (
            <ul>
              {(tab === "posts" ? active : archived).map((p) => (
                <li key={p.id} className="flex gap-3 border-b border-border px-4 py-4">
                  {p.image_url && <img src={p.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap break-words text-sm">{p.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button onClick={() => setArchived(p.id, !p.archived)} aria-label={p.archived ? "Restaurar" : "Arquivar"} className="text-muted-foreground hover:text-foreground">{p.archived ? <Undo2 size={16} /> : <Archive size={16} />}</button>
                    <button onClick={() => remove(p.id)} aria-label="Apagar" className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty text={tab === "posts" ? "Nenhum post ainda." : "Nada arquivado."} />
        )}
      </div>

      {editing && profile && <EditSheet userId={user.id} profile={profile} onClose={() => setEditing(false)} />}
    </main>
  );
}

function Empty({ text, cta }: { text: string; cta?: boolean }) {
  return (
    <div className="p-10 text-center text-sm text-muted-foreground">
      {text}
      {cta && <Link to="/creator" className="mt-2 block font-semibold text-foreground">Anunciar no Creator</Link>}
    </div>
  );
}

type P = { display_name: string | null; username: string | null; bio: string | null; logo_url: string | null; name_changed_at: string | null };

function EditSheet({ userId, profile, onClose }: { userId: string; profile: P; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ display_name: "", username: "", bio: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const logo = useRef<HTMLInputElement>(null);
  useEffect(() => setF({ display_name: profile.display_name ?? "", username: profile.username ?? "", bio: profile.bio ?? "" }), [profile]);

  const next = profile.name_changed_at ? new Date(profile.name_changed_at).getTime() + 15 * DAY : 0;
  const locked = next > Date.now();
  const refresh = () => qc.invalidateQueries({ queryKey: ["profile", userId] });

  async function upload(kind: "logo_url", file?: File) {
    if (!file) return;
    setBusy(kind);
    try {
      const url = await uploadMedia(userId, file);
      const { error } = await supabase.from("profiles").update({ logo_url: url }).eq("id", userId);
      if (error) throw error;
      refresh();
    } catch (e) { toast.error("Falha no envio", { description: (e as Error).message }); }
    finally { setBusy(null); }
  }

  async function save() {
    setBusy("save");
    const patch: { username: string | null; bio: string; display_name?: string } = { username: f.username.trim().toLowerCase() || null, bio: f.bio.trim() };
    if (f.display_name.trim() !== (profile.display_name ?? "")) patch.display_name = f.display_name.trim();
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    setBusy(null);
    if (error) toast.error(error.message.includes("NAME_COOLDOWN") ? "Nome só pode mudar a cada 15 dias" : error.code === "23505" ? "Esse usuário já existe" : "Erro ao salvar");
    else { toast.success("Perfil salvo"); refresh(); onClose(); }
  }

  const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground disabled:opacity-50";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between"><h2 className="font-bold">Editar perfil</h2><button onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>

        <button onClick={() => logo.current?.click()} className="relative -mt-8 ml-4 block h-20 w-20 overflow-hidden rounded-full border-4 border-card bg-secondary">
          {profile.logo_url && <img src={profile.logo_url} alt="" className="h-full w-full object-cover" />}
          <span className="absolute inset-0 flex items-center justify-center bg-background/40"><Camera size={14} /></span>
        </button>
        <input ref={logo} type="file" accept="image/*" hidden onChange={(e) => upload("logo_url", e.target.files?.[0])} />

        <label className="mt-4 block text-xs text-muted-foreground">Nome
          <input className={input} value={f.display_name} disabled={locked} maxLength={60} onChange={(e) => setF({ ...f, display_name: e.target.value })} />
          <span className="mt-1 block text-[11px]">{locked ? `Você poderá mudar o nome em ${new Date(next).toLocaleDateString("pt-BR")}.` : "O nome pode ser alterado a cada 15 dias."}</span>
        </label>
        <label className="mt-3 block text-xs text-muted-foreground">Usuário
          <input className={input} value={f.username} maxLength={30} onChange={(e) => setF({ ...f, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, "") })} />
        </label>
        <label className="mt-3 block text-xs text-muted-foreground">Bio
          <textarea className={input} rows={3} value={f.bio} maxLength={280} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        </label>
        <button onClick={save} disabled={busy !== null} className="mt-5 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy === "save" ? "Salvando..." : "Salvar"}</button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">Para apagar ou arquivar posts, use as abas Posts e Arquivo do perfil.</p>
      </div>
    </div>
  );
}
