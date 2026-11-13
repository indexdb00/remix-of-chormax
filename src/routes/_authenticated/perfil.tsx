import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Repeat2, Camera, Grid3x3, MessageSquare, Package, Pencil, Settings, Trash2, X, Star, ShoppingBag, TrendingUp } from "lucide-react";
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
  const [tab, setTab] = useState<"produtos" | "posts" | "reposts" | "ups" | "assinantes">("posts");
  const [balanceView, setBalanceView] = useState<"sales" | "purchases">("sales");
  const [activityOpen, setActivityOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  useEffect(() => {
    if (profile && !profile.username) setUsernameDraft((profile.display_name || "").toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 24));
  }, [profile]);

  async function saveFirstUsername() {
    const username = usernameDraft.trim().toLowerCase();
    if (!/^[a-z0-9._]{3,30}$/.test(username)) { toast.error("Use de 3 a 30 caracteres: letras, números, ponto ou sublinhado."); return; }
    setUsernameBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, username }, { onConflict: "id" });
    setUsernameBusy(false);
    if (error) toast.error(error.code === "23505" ? "Esse @ já está em uso. Escolha outro." : "Não foi possível salvar o @", { description: error.message });
    else { toast.success("Seu @ está definido!"); await qc.invalidateQueries({ queryKey: ["profile", user.id] }); }
  }

  const { data: products = [] } = useQuery({
    queryKey: ["my-products", user.id],
    queryFn: async () => (await supabase.from("products").select("id,name,slug,price_cents,images,sales").eq("creator_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["my-posts", user.id],
    queryFn: async () => (await supabase.from("feed_posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: followers = 0 } = useQuery({
    queryKey: ["followers-count", user.id],
    queryFn: async () => (await supabase.from("profile_follows").select("id", { count: "exact", head: true }).eq("following_id", user.id)).count ?? 0,
  });
  const { data: following = 0 } = useQuery({
    queryKey: ["following-count", user.id],
    queryFn: async () => (await supabase.from("profile_follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id)).count ?? 0,
  });

  const { data: activity = { reposts: [], ups: [], repostDates: [] as string[], upDates: [] as string[] } } = useQuery({
    queryKey: ["profile-activity", user.id],
    queryFn: async () => {
      const [r, u] = await Promise.all([
        supabase.from("post_reposts").select("post_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("post_ups").select("post_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      const load = async (ids: string[]) => ids.length ? ((await supabase.from("feed_posts").select(POST_SELECT).in("id", ids)).data ?? []) as unknown as CommunityPost[] : [];
      return {
        reposts: await load((r.data ?? []).map((x) => x.post_id)),
        ups: await load((u.data ?? []).map((x) => x.post_id)),
        repostDates: (r.data ?? []).map((x) => x.created_at),
        upDates: (u.data ?? []).map((x) => x.created_at),
      };
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
  // The current marketplace stores cumulative totals, not dated transaction events.
  const heatmapDays = Array.from({ length: 84 }, (_, index) => index);

  async function remove(id: string) {
    if (!confirm("Apagar este post?")) return;
    await supabase.from("saved_items").delete().eq("post_id", id);
    const { error } = await supabase.from("feed_posts").delete().eq("id", id);
    if (error) toast.error("Erro"); else { toast.success("Post apagado"); qc.invalidateQueries({ queryKey: ["my-posts", user.id] }); }
  }

  const name = profile?.display_name || "Sem nome";

  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-3 pt-2 sm:px-5 sm:pt-4">
        <section className="relative overflow-hidden rounded-2xl bg-[#111111] p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-white/[0.035] blur-3xl" />
          <div className="relative grid gap-4 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  <div className="relative h-[68px] w-[68px] shrink-0 rounded-[20px] bg-gradient-to-br from-white/10 via-zinc-700 to-[#17171d] p-1 shadow-[0_10px_35px_rgba(139,92,246,.16)] sm:h-24 sm:w-24">
                    <div className="h-full w-full overflow-hidden rounded-[21px] bg-[#24242c]">
                      {profile?.logo_url ? <img src={profile.logo_url} alt={name} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-3xl font-bold text-white">{name[0]?.toUpperCase()}</span>}
                    </div>
                    <button onClick={() => setEditing(true)} aria-label="Editar foto do perfil" className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-white text-black shadow-lg"><Pencil size={13} /></button>
                  </div>
                  <div className="min-w-0">
                    
                    <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">{name}</h1>
                    <button onClick={() => setEditing(true)} className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"><span>@{profile?.username || "sem_usuario"}</span><Pencil size={11} /></button>
                    {isCreator && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white"><BadgeCheck size={12} /> Creator</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to="/creator" className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"><Package size={14} /> <span className="hidden sm:inline">Creator</span></Link>
                  <Link to="/configuracoes" aria-label="Configurações" className="rounded-xl bg-white/[0.06] p-2.5 text-white/75 transition hover:bg-white/10"><Settings size={16} /></Link>
                </div>
              </div>
              {profile?.bio && <p className="mt-5 max-w-xl whitespace-pre-wrap text-sm leading-6 text-white/55">{profile.bio}</p>}
              <div className="mt-3 grid grid-cols-4 gap-2 pt-2 text-center">
                {[["Posts", active.length], ["Seguidores", followers], ["Seguindo", following], ["Ups", upsReceived]].map(([l, v]) => (
                  <div key={l as string}><p className="text-lg font-semibold tabular-nums text-white">{v}</p><p className="mt-1 text-[10px] text-white/40 sm:text-xs">{l}</p></div>
                ))}
              </div>
            </div>

            {profile?.show_totals !== false && <div className="rounded-2xl bg-[#171717] p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-medium text-white/55">{balanceView === "sales" ? "Vendas" : "Compras"}</p></div>
                <button
                  type="button"
                  onClick={() => setBalanceView((current) => current === "sales" ? "purchases" : "sales")}
                  aria-label={balanceView === "sales" ? "Mostrar saldo de compras" : "Mostrar saldo de vendas"}
                  title={balanceView === "sales" ? "Mostrar compras" : "Mostrar vendas"}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/70 transition hover:rotate-180 hover:bg-white/10"
                ><Repeat2 size={17} /></button>
              </div>
              <button type="button" onClick={() => setActivityOpen(true)} aria-label="Expandir mapa de atividade comercial" className="mt-2 flex w-full items-center justify-between gap-3 rounded-lg bg-white/[0.035] px-2.5 py-2 text-left transition hover:bg-white/[0.06]">
                <span className="min-w-0"><span className="block text-[10px] font-medium text-white/55">Atividade</span><span className="mt-0.5 block text-[9px] text-white/30">Últimas 12 semanas</span></span>
                <span className="grid shrink-0 grid-flow-col grid-rows-3 gap-[3px]" aria-hidden="true">{heatmapDays.slice(-21).map((day) => <span key={day} className={"h-[6px] w-[6px] rounded-[2px] " + (balanceView === "sales" ? "bg-emerald-400/20" : "bg-sky-400/20")} />)}</span>
                <span className="text-[10px] text-white/45">Ver</span>
              </button>
              <div className="mt-2 min-h-0">
                <p className="text-xs text-white/40">{balanceView === "sales" ? "Total em vendas" : "Total em compras"}</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-white tabular-nums sm:text-xl">{brl(balanceView === "sales" ? profile?.total_sold_cents ?? 0 : profile?.total_bought_cents ?? 0)}</p>
                <p className="mt-3 text-[10px] text-white/30">Valores registrados na sua conta ChromaX</p>
              </div>
            </div>}
          </div>
        </section>



        <section className="mt-6 overflow-hidden rounded-2xl bg-[#111111]">
          <div className="grid grid-cols-5">
            {([["posts", MessageSquare, "Posts"], ["reposts", Repeat2, "Reposts"], ["produtos", Grid3x3, "Seller"], ["assinantes", Star, "Assinantes"]] as const).map(([k, I, l]) => (
              <button key={k} onClick={() => setTab(k)} className={"relative flex flex-col items-center justify-center gap-1.5 px-1 py-4 text-[10px] transition sm:flex-row sm:gap-2 sm:text-xs " + (tab === k ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <I size={16} /> {l}
                {tab === k && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white" />}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-4 overflow-hidden rounded-2xl bg-[#101010]">
          {tab === "assinantes" && <Empty text="Seus assinantes aparecerão aqui quando as assinaturas estiverem disponíveis." />}

          {tab === "produtos" && (
            products.length ? (
              <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:gap-3 sm:p-3">
                {products.map((p) => (
                  <Link key={p.id} to="/produto/$slug" params={{ slug: p.slug }} className="group relative aspect-square overflow-hidden rounded-2xl bg-[#171717]">
                    {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center"><Package className="text-muted-foreground" /></span>}
                    <span className="absolute inset-x-2 bottom-2 rounded-lg  bg-black/65 px-2.5 py-2 text-xs font-semibold text-white backdrop-blur">{brl(p.price_cents)}</span>
                  </Link>
                ))}
              </div>
            ) : <Empty text="Nenhum produto ainda." cta />
          )}

          {(tab === "reposts" || tab === "ups") && (
            activity[tab].length ? <div>{activity[tab].map((p) => <PostCard key={p.id} post={p} repostedBy={tab === "reposts" ? "Você" : undefined} />)}</div>
              : <Empty text={tab === "reposts" ? "Você ainda não repostou nada." : "Você ainda não deu Up em nenhum post."} />
          )}

          {tab === "posts" && (
            active.length ? (
              <ul>
                {active.map((p) => (
                  <li key={p.id} className="flex gap-3  px-4 py-4 last:border-0">
                    {p.image_url && <img src={p.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap break-words text-sm">{p.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button onClick={() => remove(p.id)} aria-label="Apagar" className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Empty text="Nenhum post ainda." />
          )}
        </div>
      </div>

      {activityOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Mapa de atividade comercial" onClick={() => setActivityOpen(false)}>
        <section className="w-full max-w-md rounded-2xl bg-[#151515] p-4 text-white shadow-2xl sm:p-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Atividade comercial</p><p className="mt-1 text-[10px] text-white/40">{balanceView === "sales" ? "Vendas · verde" : "Compras · azul"} · últimas 12 semanas</p></div><button type="button" onClick={() => setActivityOpen(false)} aria-label="Fechar atividade" className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/70"><X size={16} /></button></div>
          <div className="mt-5 flex justify-center"><div className="grid grid-flow-col grid-rows-7 gap-1">{heatmapDays.map((day) => <span key={day} title="Sem transação registrada" className={"h-[10px] w-[10px] rounded-[2px] " + (balanceView === "sales" ? "bg-emerald-400/15" : "bg-sky-400/15")} />)}</div></div>
          <div className="mt-5 text-center"><p className="text-xs font-medium text-white/75">Seu histórico aparecerá aqui</p><p className="mx-auto mt-1 max-w-xs text-[10px] leading-5 text-white/40">O checkout atual ainda não registra as datas individuais de compras e vendas. O mapa será preenchido quando esse histórico estiver disponível.</p></div>
        </section>
      </div>}
      {editing && profile && <EditSheet userId={user.id} profile={profile} onClose={() => setEditing(false)} />}
      {profile !== undefined && !profile?.username && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"><section className="w-full max-w-md rounded-3xl bg-[#17171c] p-6 text-white shadow-2xl sm:p-8"><p className="font-mono text-[10px] tracking-[.22em] text-slate-400">CHROMAX / IDENTIDADE</p><h2 className="mt-3 text-2xl font-bold">Escolha seu @.</h2><p className="mt-2 text-sm leading-6 text-slate-400">Esse será seu nome único na comunidade. As pessoas poderão encontrar e mencionar você por ele.</p><label className="mt-6 block text-xs font-medium text-slate-300">Nome de usuário<div className="mt-2 flex items-center rounded-xl bg-black/30 px-4 focus-within:border-white/50"><span className="text-slate-500">@</span><input autoFocus value={usernameDraft} maxLength={30} onChange={(e) => setUsernameDraft(e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase())} placeholder="seu_usuario" className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none"/></div></label><p className="mt-2 text-[11px] text-slate-500">Mínimo de 3 caracteres. Use letras, números, ponto ou sublinhado.</p><button onClick={saveFirstUsername} disabled={usernameBusy} className="mt-6 w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-50">{usernameBusy ? "Salvando..." : "Confirmar meu @ "}</button></section></div>}
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
  const [f, setF] = useState({ username: "", display_name: "", bio: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const logo = useRef<HTMLInputElement>(null);
  useEffect(() => setF({ username: profile.username ?? "", display_name: profile.display_name ?? "", bio: profile.bio ?? "" }), [profile]);

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
    const nextUsername = f.username.trim().toLowerCase() || null;
    if (nextUsername !== profile.username && locked) { setBusy(null); toast.error("Você poderá alterar seu @ novamente em " + new Date(next).toLocaleDateString("pt-BR") + "."); return; }
    const patch = { username: nextUsername, display_name: f.display_name.trim() || null, bio: f.bio.trim() || null };
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    setBusy(null);
    if (error) toast.error(error.message.includes("NAME_COOLDOWN") ? "Nome só pode mudar a cada 15 dias" : error.code === "23505" ? "Esse usuário já existe" : "Erro ao salvar");
    else { toast.success("Perfil salvo"); refresh(); onClose(); }
  }

  const input = "mt-1 w-full rounded-lg  bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground disabled:opacity-50";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl  bg-card p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between"><h2 className="font-bold">Editar usuário e foto</h2><button onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>

        <button onClick={() => logo.current?.click()} className="relative -mt-8 ml-4 block h-20 w-20 overflow-hidden rounded-full bg-secondary">
          {profile.logo_url && <img src={profile.logo_url} alt="" className="h-full w-full object-cover" />}
          <span className="absolute inset-0 flex items-center justify-center bg-background/40"><Camera size={14} /></span>
        </button>
        <input ref={logo} type="file" accept="image/*" hidden onChange={(e) => upload("logo_url", e.target.files?.[0])} />

        <label className="mt-4 block text-xs text-muted-foreground">Nome de exibição<input className={input} maxLength={60} value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></label>
        <label className="mt-4 block text-xs text-muted-foreground">Bio<textarea className={input} rows={3} maxLength={180} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
        <label className="mt-4 block text-xs text-muted-foreground">Nome de usuário
          <div className="mt-1 flex items-center rounded-lg  bg-background px-3 focus-within:border-foreground">
            <span className="text-sm text-muted-foreground">@</span>
            <input className="w-full bg-transparent px-2 py-2.5 text-sm outline-none" value={f.username} maxLength={30} onChange={(e) => setF({ username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, "") })} />
          </div>
          <span className="mt-1 block text-[11px]">Use letras, números, ponto ou sublinhado.</span>
        </label>
        <button onClick={save} disabled={busy !== null} className="mt-5 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy === "save" ? "Salvando..." : "Salvar"}</button>
        
      </div>
    </div>
  );
}
