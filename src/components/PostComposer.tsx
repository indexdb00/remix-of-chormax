import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileUp, FileText, X, Camera, Paperclip, Send } from "lucide-react";
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
  const cameraInput = useRef<HTMLInputElement>(null);
  const attachmentInput = useRef<HTMLInputElement>(null);

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
      <DialogContent className="max-w-lg rounded-2xl border-0 bg-[#111111] p-5 text-white shadow-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">Nova publicação</DialogTitle>
          <DialogDescription className="sr-only">Publique texto, foto, vídeo ou arquivo na comunidade chromaX</DialogDescription>
        </DialogHeader>
        {user ? <>
          <textarea aria-label="Texto da publicação" placeholder="Compartilhe uma ideia, atualização ou projeto..." maxLength={500} rows={5} value={body} onChange={(e) => setBody(e.target.value)} className="w-full resize-none rounded-xl bg-white/[0.045] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:bg-white/[0.065]" />
          {file && <div className="relative flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
            {preview ? (
              file.type.startsWith("video/") ? <video src={preview} controls playsInline className="h-20 w-20 rounded-lg bg-black object-cover" /> : <img src={preview} alt="Prévia do anexo" className="h-20 w-20 rounded-lg object-cover" />
            ) : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-background"><FileText /></span>}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
            <Button variant="secondary" size="icon" aria-label="Remover anexo" onClick={() => setFile(null)}><X /></Button>
          </div>}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button type="button" onClick={() => cameraInput.current?.click()} aria-label="Abrir câmera" title="Câmera" className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.07] text-white transition hover:bg-white/15"><Camera size={18} /></button>
            <button type="button" onClick={() => attachmentInput.current?.click()} aria-label="Anexar foto ou arquivo" title="Anexar foto ou arquivo" className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.07] text-white transition hover:bg-white/15">{file ? <FileUp size={18} /> : <Paperclip size={18} />}</button>
            <input ref={cameraInput} aria-label="Capturar foto" type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected && selected.size > MAX_FILE_SIZE) toast.error("A imagem deve ter até 25 MB.");
              else if (selected) setFile(selected);
              e.currentTarget.value = "";
            }} />
            <input ref={attachmentInput} aria-label="Anexar foto, vídeo ou arquivo" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv,.json,.js,.ts,.tsx,.py" hidden onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected && selected.size > MAX_FILE_SIZE) toast.error("O arquivo deve ter até 25 MB.");
              else if (selected) setFile(selected);
              e.currentTarget.value = "";
            }} />
            <span className="ml-auto font-mono text-[10px] text-white/35">{body.length}/500</span>
            <Button onClick={publish} disabled={busy || (!isValidPost(body) && !file)} className="rounded-full bg-white px-5 text-black hover:bg-white/85">{busy ? "Publicando…" : "Publicar"}<Send size={15} /></Button>
          </div>
          <p className="text-[10px] text-white/35">Câmera, fotos, vídeos e arquivos · até 25 MB</p>
        </> : <div className="py-6"><p className="mb-5 text-muted-foreground">Entre para publicar na comunidade.</p><Button asChild><Link to="/auth" onClick={closeCompose}>Entrar</Link></Button></div>}
      </DialogContent>
    </Dialog>
  );
}
