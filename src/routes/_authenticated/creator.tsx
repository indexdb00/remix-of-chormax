import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/creator")({
  head: () => ({
    meta: [
      { title: "Creator — chromaX" },
      { name: "description", content: "Publique seus itens digitais no chromaX." },
      { property: "og:title", content: "Creator — chromaX" },
      { property: "og:description", content: "Anuncie contas, códigos, plugins e templates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Creator,
});

const CATS = ["Plugin", "Template", "Software", "Asset", "Conta de jogo", "Código"];
const RARS = ["Comum", "Raro", "Épico", "Lendário"];

function Creator() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [deliverFile, setDeliverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: "", category: CATS[0], rarity: RARS[0], price: "", description: "",
    deliverable_type: "text" as "text" | "file", content: "", sale_mode: "auto" as "auto" | "chat",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(f.price.replace(",", ".")) * 100);
    if (!f.name.trim()) return toast.error("Dê um nome ao item");
    if (images.length < 3) return toast.error("Envie no mínimo 3 fotos de prévia");
    if (!cents || cents < 100) return toast.error("Preço mínimo R$ 1,00");
    if (f.deliverable_type === "text" && !f.content.trim()) return toast.error("Escreva o conteúdo que será entregue");
    if (f.deliverable_type === "file" && !deliverFile) return toast.error("Anexe o arquivo que será entregue");
    setBusy(true);
    try {
      const urls = await Promise.all(images.map((img) => uploadMedia(user.id, img)));
      const slug = `${f.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
      const { data: prof } = await supabase.from("profiles").select("username,display_name").eq("id", user.id).maybeSingle();
      const { data: prod, error } = await supabase.from("products").insert({
        slug, name: f.name.trim(), category: f.category, rarity: f.rarity, price_cents: cents,
        description: f.description.trim(), creator_id: user.id, sale_mode: f.sale_mode, images: urls,
        deliverable_type: f.deliverable_type, seller_name: prof?.username || prof?.display_name || "creator",
      }).select("id").single();
      if (error) throw error;
      let file_path: string | null = null;
      if (deliverFile) {
        file_path = `${user.id}/entregas/${crypto.randomUUID()}-${deliverFile.name}`;
        const up = await supabase.storage.from("media").upload(file_path, deliverFile);
        if (up.error) throw up.error;
      }
      const d = await supabase.from("product_deliverables").insert({
        product_id: prod.id, creator_id: user.id, content: f.deliverable_type === "text" ? f.content : null, file_path,
      });
      if (d.error) throw d.error;
      toast.success("Item publicado!");
      qc.invalidateQueries({ queryKey: ["products"] });
      navigate({ to: "/produto/$slug", params: { slug } });
    } catch (err) {
      toast.error("Não foi possível publicar", { description: (err as Error).message });
    } finally { setBusy(false); }
  }

  const input = "mt-1 w-full border border-border bg-card px-4 py-3 font-mono text-sm outline-none focus:border-primary";
  const label = "block font-mono text-xs uppercase text-muted-foreground";
  const toggle = (on: boolean) => `flex-1 border px-3 py-3 text-left font-mono text-xs uppercase ${on ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`;

  return (
    <main className="min-h-screen bg-background pb-28 font-sans text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-5 py-10">
        <p className="font-mono text-sm text-accent">[ CREATOR ]</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase">Anunciar <span className="text-chrome">item</span></h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <p className={label}>Fotos de prévia (mín. 3) — {images.length}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square border border-border">
                  <img src={URL.createObjectURL(img)} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Remover" onClick={() => setImages(images.filter((_, k) => k !== i))} className="absolute right-1 top-1 bg-background p-1"><X size={12} /></button>
                </div>
              ))}
              {images.length < 8 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border font-mono text-[10px] uppercase text-muted-foreground hover:border-primary">
                  <ImagePlus size={20} /> Adicionar
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => setImages([...images, ...Array.from(e.target.files ?? [])].slice(0, 8))} />
                </label>
              )}
            </div>
          </div>
          <label className={label}>Nome<input className={input} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>Categoria<select className={input} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className={label}>Raridade<select className={input} value={f.rarity} onChange={(e) => setF({ ...f, rarity: e.target.value })}>{RARS.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          <label className={label}>Preço (R$)<input className={input} inputMode="decimal" placeholder="49,90" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
          <label className={label}>Descrição<textarea className={input} rows={4} maxLength={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>

          <div>
            <p className={label}>O que será entregue</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={toggle(f.deliverable_type === "text")} onClick={() => setF({ ...f, deliverable_type: "text" })}>Texto (conta, código)</button>
              <button type="button" className={toggle(f.deliverable_type === "file")} onClick={() => setF({ ...f, deliverable_type: "file" })}>Arquivo</button>
            </div>
            {f.deliverable_type === "text" ? (
              <textarea className={input} rows={3} placeholder="Login, senha, chave de ativação..." value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
            ) : (
              <input type="file" className={input} onChange={(e) => setDeliverFile(e.target.files?.[0] ?? null)} />
            )}
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">Fica escondido. É enviado automaticamente ao comprador após a compra.</p>
          </div>

          <div>
            <p className={label}>Como fechar a venda</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={toggle(f.sale_mode === "auto")} onClick={() => setF({ ...f, sale_mode: "auto" })}>Automática<br /><span className="normal-case">preço fixo</span></button>
              <button type="button" className={toggle(f.sale_mode === "chat")} onClick={() => setF({ ...f, sale_mode: "chat" })}>Pelo chat<br /><span className="normal-case">negociar preço</span></button>
            </div>
          </div>

          <button disabled={busy} className="w-full bg-primary px-6 py-4 font-mono text-sm font-bold uppercase text-primary-foreground hover:bg-foreground disabled:opacity-50">
            {busy ? "Publicando..." : "Publicar item"}
          </button>
        </form>
      </section>
    </main>
  );
}
