import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, LogOut, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { uploadMedia } from "@/lib/media";

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

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Perfil() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const { data: myProducts } = useQuery({
    queryKey: ["my-products", user.id],
    queryFn: async () =>
      (await supabase.from("products").select("id,name,slug,price_cents,images,sales,rarity").eq("creator_id", user.id).order("created_at", { ascending: false })).data ?? [],
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

  async function upload(kind: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadMedia(user.id, file);
      const { error } = await supabase.from("profiles").update(kind === "logo" ? { logo_url: url } : { banner_url: url }).eq("id", user.id);
      if (error) throw error;
      toast.success(kind === "logo" ? "Foto atualizada" : "Banner atualizado");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err) {
      toast.error("Falha no envio", { description: (err as Error).message });
    } finally { setUploading(null); }
  }

  async function toggleBannerPublic() {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ banner_public: !profile.banner_public }).eq("id", user.id);
    if (error) toast.error("Erro ao salvar");
    else qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const input = "w-full border border-border bg-card px-4 py-3 font-mono text-sm outline-none focus:border-primary";
  const label = "block font-mono text-xs uppercase text-muted-foreground";
  const totalSales = (myProducts ?? []).reduce((s, p) => s + p.sales, 0);

  return (
    <main className="min-h-screen bg-background pb-28 font-sans text-foreground">
      <SiteHeader />

      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden border-b border-border bg-card sm:h-56">
        {profile?.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs uppercase text-muted-foreground">Sem banner</div>
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          {profile?.banner_url && (
            <button onClick={toggleBannerPublic} className="border border-border bg-background/90 px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground">
              {profile.banner_public ? "Público" : "Privado"}
            </button>
          )}
          <button onClick={() => bannerInput.current?.click()} disabled={uploading !== null} className="inline-flex items-center gap-1 border border-border bg-background/90 px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground disabled:opacity-50">
            <ImagePlus size={12} /> {uploading === "banner" ? "Enviando..." : "Banner"}
          </button>
          <input ref={bannerInput} type="file" accept="image/*" hidden onChange={(e) => upload("banner", e.target.files?.[0])} />
        </div>
      </div>

      <section className="mx-auto max-w-2xl px-5">
        {/* Avatar + identidade */}
        <div className="-mt-10 flex items-end gap-4">
          <button onClick={() => logoInput.current?.click()} disabled={uploading !== null} className="group relative h-24 w-24 shrink-0 overflow-hidden border border-border bg-card disabled:opacity-50" aria-label="Trocar foto">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-display text-2xl font-extrabold text-chrome">
                {(profile?.display_name || user.email || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={18} />
            </span>
          </button>
          <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => upload("logo", e.target.files?.[0])} />
          <div className="pb-1">
            <p className="font-mono text-sm text-accent">[ PERFIL ]</p>
            <h1 className="font-display text-2xl font-extrabold uppercase sm:text-3xl">{profile?.display_name || "Sem nome"}</h1>
            <p className="font-mono text-xs text-muted-foreground">
              {profile?.username ? `@${profile.username} · ` : ""}{user.email}
            </p>
          </div>
        </div>

        {/* Totais reais */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            ["Total comprado", brl(profile?.total_bought_cents ?? 0)],
            ["Total vendido", brl(profile?.total_sold_cents ?? 0)],
            ["Vendas", String(totalSales)],
          ].map(([l, v]) => (
            <div key={l} className="border border-border bg-card p-4">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">{l}</p>
              <p className="mt-1 font-mono text-lg font-bold text-chrome sm:text-xl">{v}</p>
            </div>
          ))}
        </div>

        {/* Meus itens */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <p className={label}>Meus itens ({myProducts?.length ?? 0})</p>
            <Link to="/creator" className="font-mono text-[10px] uppercase text-accent hover:underline">+ Anunciar</Link>
          </div>
          {myProducts && myProducts.length > 0 ? (
            <ul className="mt-3 divide-y divide-border border border-border">
              {myProducts.map((p) => (
                <li key={p.id}>
                  <Link to="/produto/$slug" params={{ slug: p.slug }} className="flex items-center gap-3 p-3 hover:bg-card">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" className="h-12 w-12 border border-border object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center border border-border bg-card"><Package size={16} className="text-muted-foreground" /></span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm">{p.name}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">{p.rarity} · {p.sales} vendas</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-chrome">{brl(p.price_cents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 border border-dashed border-border p-6 text-center font-mono text-xs text-muted-foreground">
              Você ainda não anunciou nada. Vá até a área Creator para publicar seu primeiro item.
            </p>
          )}
        </div>

        {/* Editar dados */}
        <form onSubmit={save} className="mt-10 space-y-3">
          <p className={label}>Editar dados</p>
          <label className={label}>Nome
            <input className={`${input} mt-1`} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} maxLength={60} />
          </label>
          <label className={label}>Usuário
            <input className={`${input} mt-1`} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, "") })} maxLength={30} placeholder="seu_usuario" />
          </label>
          <label className={label}>Bio
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
