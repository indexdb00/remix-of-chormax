import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ImagePlus, X, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommunity } from "./CommunityProvider";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media";
import { isValidPost } from "@/lib/community-rules";

export function PostComposer() {
  const { user, composing, closeCompose } = useCommunity();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("geral");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  async function publish() {
    if (!user || !isValidPost(body)) return;
    setBusy(true);
    try {
      const image_url = file ? await uploadMedia(user.id, file) : null;
      const { error } = await supabase.from("feed_posts").insert({ author_id: user.id, body: body.trim(), kind, image_url });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["posts"] });
      setBody(""); setFile(null); closeCompose(); toast.success("Post publicado");
    } catch { toast.error("Não foi possível publicar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <Dialog open={composing} onOpenChange={(open) => { if (!open && !busy) closeCompose(); }}><DialogContent className="max-w-lg rounded-lg border-border bg-popover"><DialogHeader><DialogTitle className="font-display text-lg">Novo post</DialogTitle><DialogDescription className="sr-only">Publicar na comunidade chromaX</DialogDescription></DialogHeader>
    {user ? <><textarea aria-label="Texto do post" placeholder="O que está rolando?" maxLength={500} rows={5} value={body} onChange={(e) => setBody(e.target.value)} className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground" />
      {preview && <div className="relative">{file?.type.startsWith("video/") ? <video src={preview} controls playsInline className="max-h-64 w-full rounded-lg bg-black object-contain" /> : <img src={preview} alt="Prévia do post" className="max-h-64 w-full rounded-lg object-contain" />}<Button variant="secondary" size="icon" aria-label="Remover mídia" onClick={() => setFile(null)} className="absolute right-2 top-2"><X /></Button></div>}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4"><Button variant="ghost" size="icon" aria-label="Adicionar foto ou vídeo" title="Adicionar foto ou vídeo" onClick={() => input.current?.click()}><ImagePlus /></Button><input ref={input} aria-label="Imagem do post" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size > (f.type.startsWith("video/") ? 50 : 10) * 1024 * 1024) { toast.error(f.type.startsWith("video/") ? "Envie um vídeo de até 50 MB" : "Envie uma imagem de até 10 MB"); return; } if (f && !f.type.startsWith("image/") && !f.type.startsWith("video/")) { toast.error("Formato de mídia não suportado"); return; } setFile(f ?? null); }} /><select aria-label="Tipo do post" value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-md border border-border bg-secondary px-2 py-2 text-xs"><option value="geral">Conversa</option><option value="ajuda">Pedido de ajuda</option><option value="pre-venda">Pré-venda</option></select><span className="ml-auto font-mono text-xs text-muted-foreground">{body.length}/500</span><Button onClick={publish} disabled={busy || !isValidPost(body)}>{busy ? "Publicando…" : "Publicar"}<ArrowUpRight /></Button></div>
    </> : <div className="py-6"><p className="mb-5 text-muted-foreground">Entre para conversar com a comunidade.</p><Button asChild><Link to="/auth" onClick={closeCompose}>Entrar</Link></Button></div>}
  </DialogContent></Dialog>;
}