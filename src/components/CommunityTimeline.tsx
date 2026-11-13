import { Suspense, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Globe2, Users, Plus, MessageSquare, Send, ImagePlus, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "./SiteHeader";
import { useCommunity } from "./CommunityProvider";
import { FriendConnections } from "./FriendConnections";
import { PostCard } from "./PostCard";
import { postsQuery } from "@/lib/community";
import { HomeSocialPreview } from "./HomeSocialPreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidPost } from "@/lib/community-rules";
import { uploadMedia } from "@/lib/media";

function Posts({ scope, userId }: { scope: "global" | "friends" | "all"; userId: string | undefined }) {
  const { data } = useSuspenseQuery(postsQuery(scope, userId));
  const { compose } = useCommunity();
  if (!data.length) return <div className="flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary">{scope === "friends" ? <Users size={23} /> : <MessageSquare size={23} />}</div><h2 className="text-lg font-semibold">{scope === "friends" ? "Sua roda começa aqui" : "A comunidade está começando"}</h2><p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">{scope === "friends" ? "Ainda não há posts dos seus amigos. Encontre a comunidade e faça novas conexões." : "Compartilhe uma ideia, peça ajuda ou mostre o que está criando."}</p>{scope === "friends" ? <Button asChild variant="secondary" className="mt-6"><Link to="/feed">Encontrar a comunidade<ArrowUpRight /></Link></Button> : <Button className="mt-6" onClick={compose}><Plus />Novo post</Button>}</div>;
  return <div>{data.map((post) => <PostCard key={post.id} post={post} />)}</div>;
}
function InlineQuickPost({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const canPublish = isValidPost(body) || !!file;

  async function publish() {
    const content = body.trim();
    if (!canPublish || busy) return;
    setBusy(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user || authData.user.id !== userId) {
        throw new Error("Sua sessão expirou. Entre novamente para publicar.");
      }
      const imageUrl = file ? await uploadMedia(authData.user.id, file) : null;
      const { error } = await supabase.from("feed_posts").insert({
        author_id: authData.user.id,
        body: content,
        kind: "geral",
        image_url: imageUrl,
      });
      if (error) throw error;
      setBody("");
      setFile(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["posts"] }),
        qc.invalidateQueries({ queryKey: ["home-story-previews"] }),
        qc.invalidateQueries({ queryKey: ["explore-posts"] }),
      ]);
      toast.success("Publicação compartilhada");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      toast.error("Não foi possível publicar", { description: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void publish(); }} className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 sm:px-7">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
        <Plus size={16} />
      </div>
      <label className="sr-only" htmlFor="home-quick-post">O que está rolando?</label>
      <input
        id="home-quick-post"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={500}
        placeholder="O que está rolando?"
        disabled={busy}
        className="h-10 min-w-0 flex-1 rounded-full border border-white/[.09] bg-white/[.035] px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/75 focus:border-white/25 focus:bg-white/[.06]"
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv,.json,.js,.ts,.tsx,.py"
        className="hidden"
        aria-label="Selecionar foto, vídeo ou arquivo"
        onChange={(event) => {
          const selected = event.currentTarget.files?.[0];
          if (selected && selected.size > 25 * 1024 * 1024) {
            toast.error("O arquivo deve ter até 25 MB.");
          } else if (selected) {
            setFile(selected);
          }
          event.currentTarget.value = "";
        }}
      />
      <Button type="button" size="icon" variant="ghost" disabled={busy} onClick={() => fileInput.current?.click()} aria-label="Anexar foto, vídeo ou arquivo" title="Anexar foto, vídeo ou arquivo" className="h-9 w-9 shrink-0 rounded-full">
        <ImagePlus size={17} />
      </Button>
      <span className="hidden text-[10px] tabular-nums text-muted-foreground sm:block">{body.length}/500</span>
      <Button type="submit" size="icon" disabled={busy || !canPublish} aria-label="Publicar post" title="Publicar post" className="h-9 w-9 shrink-0 rounded-full">
        {busy ? <span className="text-[10px]">…</span> : <Send size={15} />}
      </Button>
      {file && <div className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs">
        <FileText size={14} className="shrink-0 text-white/60" />
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        <span className="shrink-0 text-white/40">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        <button type="button" onClick={() => setFile(null)} disabled={busy} aria-label="Remover anexo" className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"><X size={14} /></button>
      </div>}
    </form>
  );
}

export function CommunityTimeline({ scope }: { scope: "global" | "friends" | "all" }) {
  const { user, ready, compose } = useCommunity();
  return <main className="min-h-screen bg-background pb-32 font-sans text-foreground"><SiteHeader />{scope === "all" && <div className="sticky top-[68px] z-20 border-b border-border bg-background/95 shadow-[0_8px_24px_rgba(0,0,0,.28)] backdrop-blur-xl"><HomeSocialPreview />{user && <div className="border-t border-white/[.06]"><InlineQuickPost userId={user.id} /></div>}</div>}<div className="mx-auto grid max-w-6xl md:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)_250px]">
    {scope !== "all" && <aside className="hidden px-6 py-9 md:block"><p className="mb-8 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Seu universo digital</p><div className="space-y-2"><Button asChild variant="ghost" className={`w-full justify-start hover:bg-secondary hover:text-foreground ${scope === "friends" ? "bg-secondary" : "text-muted-foreground"}`}><Link to="/"><Users />Seus amigos</Link></Button><Button asChild variant="ghost" className={`w-full justify-start hover:bg-secondary hover:text-foreground ${scope === "global" ? "bg-secondary" : "text-muted-foreground"}`}><Link to="/feed"><Globe2 />Explorar</Link></Button><Button asChild variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-secondary hover:text-foreground"><Link to="/feed"><Globe2 />Descobrir</Link></Button></div><div className="mt-10 border-t border-border pt-6"><p className="text-xs font-semibold">Um espaço para criar.</p><p className="mt-2 text-xs leading-6 text-muted-foreground">Código, games e boas conversas.</p></div></aside>}
    <section className="min-w-0 border-x border-border">{scope !== "all" && <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-7 sm:px-7"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{scope === "friends" ? "Só quem você segue" : scope === "all" ? "Amigos e comunidade" : "Novas pessoas e criadores"}</p><h1 className="font-display text-xl font-extrabold">{scope === "friends" || scope === "all" ? "Início" : "Feed · Descobrir"}</h1></div>{scope === "global" ? <Globe2 size={22} className="text-muted-foreground" /> : <Users size={22} className="text-muted-foreground" />}</header>}
    {scope !== "all" && user && <div className="flex items-center gap-3 border-b border-border px-5 py-5 sm:px-7"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Plus size={18} /></div><Button variant="ghost" onClick={compose} className="flex-1 justify-start overflow-hidden text-muted-foreground hover:bg-secondary hover:text-foreground">O que está rolando?</Button><Button size="icon" variant="secondary" onClick={compose} title="Novo post" aria-label="Novo post"><ArrowUpRight /></Button></div>}
    {!ready && scope === "friends" ? <p className="p-10 text-sm text-muted-foreground">Carregando…</p> : scope === "friends" && !user ? <div className="px-6 py-20 text-center"><Users className="mx-auto mb-6 text-muted-foreground" size={32} /><h2 className="text-xl font-semibold">As conversas dos seus amigos.</h2><p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-muted-foreground">Entre para encontrar sua turma e acompanhar o que ela compartilha.</p><div className="mt-7 flex justify-center gap-3"><Button asChild><Link to="/auth">Entrar<ArrowUpRight /></Link></Button><Button asChild variant="secondary"><Link to="/feed">Ver feed global</Link></Button></div></div> : <>{scope === "global" && user && <div className="border-b border-border px-5 lg:hidden"><FriendConnections title="Sugestões para seguir" /></div>}<Suspense fallback={<p className="p-10 text-sm text-muted-foreground">Carregando posts…</p>}><Posts scope={scope} userId={user?.id} /></Suspense></>}
    {scope === "friends" && <div className="border-t border-border px-5 lg:hidden"><FriendConnections /></div>}</section>
    {scope !== "all" && <aside className="hidden px-6 py-8 lg:block"><div className="border-b border-border pb-7"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Marketplace</p><h2 className="mt-3 text-base font-semibold">O próximo drop está chegando.</h2><p className="mt-3 text-xs leading-6 text-muted-foreground">Pré-lançamento · Janeiro</p><Button asChild variant="secondary" className="mt-4 w-full justify-between"><Link to="/feed">Explorar itens<ArrowUpRight /></Link></Button></div><FriendConnections title={scope === "global" ? "Sugestões para seguir" : "Conexões"} /><p className="mt-8 font-mono text-[10px] text-muted-foreground">chromaX · comunidade digital</p></aside>}
  </div></main>;
}