import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileUp, FileText, X, ArrowUpRight, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommunity } from "./CommunityProvider";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media";
import { isValidPost } from "@/lib/community-rules";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const isImage = (file: File) => file.type.startsWith("image/");
const isVideo = (file: File) => file.type.startsWith("video/");

export function PostComposer() {
  const { user, composing, draftFile, closeCompose } = useCommunity();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("geral");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (composing && draftFile) setFile(draftFile); }, [composing, draftFile]);
  useEffect(() => {
    if (!file || (!isImage(file) && !isVideo(file))) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function publish() {
    if (!user || (!isValidPost(body) && !file) || busy) return;
    setBusy(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user || authData.user.id !== user.id) {
        throw new Error("Sua sessão expirou. Entre novamente para publicar.");
      }
      const attachmentUrl = file ? await uploadMedia(authData.user.id, file) : null;
      const { error } = await supabase.from("feed_posts").insert({
        author_id: authData.user.id,
        body: body.trim(),
        kind,
        image_url: attachmentUrl,
      });
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["posts"] }),
        qc.invalidateQueries({ queryKey: ["explore-posts"] }),
        qc.invalidateQueries({ queryKey: ["home-story-previews"] }),
      ]);
      setBody("");
      setFile(null);
      closeCompose();
      toast.success("Publicação compartilhada");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verifique sua conexão e tente novamente.";
      toast.error("Não foi possível publicar", { description: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={composing} onOpenChange={(open) => { if (!open && !busy) { setBody(""); setFile(null); closeCompose(); } }}>
      <DialogContent className="max-w-lg rounded-lg border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Novo post</DialogTitle>
          <DialogDescription className="sr-only">Publique texto, foto, vídeo ou arquivo na comunidade chromaX</DialogDescription>
        </DialogHeader>
        {user ? <>
          <textarea aria-label="Texto do post" placeholder="O que está rolando? (opcional se anexar um arquivo)" maxLength={500} rows={5} value={body} onChange={(e) => setBody(e.target.value)} className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground" />
          {file && <div className="relative flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3">
            {preview ? (
              file.type.startsWith("video/") ? <video src={preview} controls playsInline className="h-20 w-20 rounded-lg bg-black object-cover" /> : <img src={preview} alt="Prévia do anexo" className="h-20 w-20 rounded-lg object-cover" />
            ) : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-background"><FileText /></span>}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
            <Button variant="secondary" size="icon" aria-label="Remover anexo" onClick={() => setFile(null)}><X /></Button>
          </div>}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button variant="ghost" size="icon" aria-label="Adicionar foto, vídeo ou arquivo" title="Adicionar foto, vídeo ou arquivo" onClick={() => input.current?.click()}>{file ? <FileUp /> : <ImagePlus />}</Button>
            <input ref={input} aria-label="Anexar foto, vídeo ou arquivo" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv,.json,.js,.ts,.tsx,.py" hidden onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected && selected.size > MAX_FILE_SIZE) toast.error("O arquivo deve ter até 25 MB.");
              else if (selected) setFile(selected);
              e.currentTarget.value = "";
            }} />
            <select aria-label="Tipo do post" value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-md border border-border bg-secondary px-2 py-2 text-xs"><option value="geral">Conversa</option><option value="ajuda">Pedido de ajuda</option><option value="pre-venda">Pré-venda</option></select>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{body.length}/500</span>
            <Button onClick={publish} disabled={busy || (!isValidPost(body) && !file)}>{busy ? "Publicando…" : "Publicar"}<ArrowUpRight /></Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Fotos, vídeos e documentos · até 25 MB por arquivo</p>
        </> : <div className="py-6"><p className="mb-5 text-muted-foreground">Entre para conversar com a comunidade.</p><Button asChild><Link to="/auth" onClick={closeCompose}>Entrar</Link></Button></div>}
      </DialogContent>
    </Dialog>
  );
}
