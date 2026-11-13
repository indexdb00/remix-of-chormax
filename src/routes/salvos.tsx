import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, ArrowBigUp, Bookmark, Package, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { useCommunity } from "@/components/CommunityProvider";
import { PostCard } from "@/components/PostCard";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Tab = "posts" | "products" | "ups" | "archive";

export const Route = createFileRoute("/salvos")({
  head: () => ({ meta: [{ title: "Salvos — chromaX" }, { name: "description", content: "Posts, produtos, Ups e arquivo pessoal no chromaX." }] }),
  component: Salvos,
});

function SavedContent({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("posts");
  const [busy, setBusy] = useState<string | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["saved-hub", userId],
    queryFn: async () => {
      const [saved, ups, archived] = await Promise.all([
        supabase.from("saved_items").select("post_id,product_id").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("post_ups").select("post_id").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("feed_posts").select("*, profiles(display_name,username,logo_url), post_ups(user_id), post_reposts(user_id)").eq("author_id", userId).eq("archived", true).order("created_at", { ascending: false }),
      ]);
      if (saved.error) throw saved.error;
      if (ups.error) throw ups.error;
      if (archived.error) throw archived.error;
      const postIds = saved.data.flatMap((r) => r.post_id ? [r.post_id] : []);
      const productIds = saved.data.flatMap((r) => r.product_id ? [r.product_id] : []);
      const upIds = ups.data.map((r) => r.post_id);
      const [posts, products, upPosts] = await Promise.all([
        postIds.length ? supabase.from("feed_posts").select("*, profiles(display_name,username,logo_url), post_ups(user_id), post_reposts(user_id)").in("id", postIds) : Promise.resolve({ data: [], error: null }),
        productIds.length ? supabase.from("products").select("*").in("id", productIds) : Promise.resolve({ data: [], error: null }),
        upIds.length ? supabase.from("feed_posts").select("*, profiles(display_name,username,logo_url), post_ups(user_id), post_reposts(user_id)").in("id", upIds) : Promise.resolve({ data: [], error: null }),
      ]);
      if (posts.error) throw posts.error;
      if (products.error) throw products.error;
      if (upPosts.error) throw upPosts.error;
      const order = <T extends { id: string }>(rows: T[], ids: string[]) => {
        const map = new Map(rows.map((row) => [row.id, row]));
        return ids.flatMap((id) => map.has(id) ? [map.get(id)!] : []);
      };
      return {
        posts: order(posts.data ?? [], postIds),
        products: order(products.data ?? [], productIds),
        ups: order(upPosts.data ?? [], upIds),
        archive: archived.data ?? [],
      };
    },
  });
  const items = data ?? { posts: [], products: [], ups: [], archive: [] };

  async function archivePost(id: string, archived: boolean) {
    setBusy(id);
    const { error } = await supabase.from("feed_posts").update({ archived }).eq("id", id).eq("author_id", userId);
    if (error) toast.error("Não foi possível atualizar o arquivo", { description: error.message });
    else { toast.success(archived ? "Post arquivado" : "Post restaurado"); await refetch(); }
    setBusy(null);
  }
  async function deletePost(id: string) {
    if (!confirm("Excluir permanentemente esta publicação?")) return;
    setBusy(id);
    await supabase.from("saved_items").delete().eq("post_id", id).eq("user_id", userId);
    const { error } = await supabase.from("feed_posts").delete().eq("id", id).eq("author_id", userId);
    if (error) toast.error("Não foi possível excluir", { description: error.message });
    else { toast.success("Publicação excluída"); await refetch(); }
    setBusy(null);
  }

  const tabs: { id: Tab; label: string; count: number; Icon: typeof Bookmark }[] = [
    { id: "posts", label: "Posts salvos", count: items.posts.length, Icon: Bookmark },
    { id: "products", label: "Produtos", count: items.products.length, Icon: Package },
    { id: "ups", label: "Ups", count: items.ups.length, Icon: ArrowBigUp },
    { id: "archive", label: "Arquivo", count: items.archive.length, Icon: Archive },
  ];

  return <>
    <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-white/[.035] p-1">
      {tabs.map(({ id, label, count, Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-3 text-[10px] transition sm:flex-row sm:justify-center sm:gap-2 sm:text-xs ${tab === id ? "bg-gradient-to-b from-zinc-200 to-zinc-500 font-semibold text-black shadow-lg" : "text-muted-foreground hover:bg-white/[.06]"}`}><Icon size={15}/><span>{label}</span><span className="opacity-65">{count}</span></button>)}
    </div>
    <div className="mt-5">
      {tab === "posts" && (items.posts.length ? items.posts.map((p) => <PostCard key={p.id} post={p as never}/>) : <Empty text="Você ainda não salvou publicações." />)}
      {tab === "products" && (items.products.length ? <div className="grid gap-4 sm:grid-cols-2">{items.products.map((p) => <ProductCard key={p.id} p={p}/>)}</div> : <Empty text="Seus produtos salvos aparecerão aqui." />)}
      {tab === "ups" && (items.ups.length ? items.ups.map((p) => <PostCard key={p.id} post={p as never}/>) : <Empty text="As publicações que você apoiar com Up aparecerão aqui." />)}
      {tab === "archive" && (items.archive.length ? <div className="space-y-2">{items.archive.map((p) => <article key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm">{p.body}</p><time className="mt-1 block text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</time></div><button disabled={busy === p.id} onClick={() => archivePost(p.id, false)} aria-label="Restaurar publicação" className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white"><RotateCcw size={16}/></button><button disabled={busy === p.id} onClick={() => deletePost(p.id)} aria-label="Excluir publicação" className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white"><Trash2 size={16}/></button></article>)}</div> : <Empty text="Seu arquivo está vazio." />)}
    </div>
  </>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[.04] text-zinc-300"><Bookmark size={20}/></span><p className="mt-4 text-sm text-muted-foreground">{text}</p><Link to="/explorar" className="mt-4 inline-block text-xs font-semibold text-foreground underline underline-offset-4">Explorar conteúdos</Link></div>;
}

function Salvos() {
  const { user, ready } = useCommunity();
  return <main className="min-h-screen bg-background pb-32 text-foreground"><SiteHeader/><section className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><p className="text-[10px] uppercase tracking-[.24em] text-muted-foreground">Sua biblioteca</p><h1 className="mb-7 mt-1 flex items-center gap-3 font-display text-2xl font-extrabold"><Bookmark/>Salvos</h1>{!ready ? <p className="text-sm text-muted-foreground">Carregando…</p> : user ? <SavedContent userId={user.id}/> : <div className="py-12 text-center"><p className="mb-5 text-muted-foreground">Entre para acessar seus conteúdos salvos.</p><Button asChild><Link to="/auth">Entrar</Link></Button></div>}</section></main>;
}
