import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Bookmark } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useCommunity } from "@/components/CommunityProvider";
import { PostCard } from "@/components/PostCard";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/salvos")({ head: () => ({ meta: [{ title: "Salvos — chromaX" }, { name: "description", content: "Seus posts e produtos salvos na comunidade chromaX." }, { property: "og:title", content: "Salvos — chromaX" }, { property: "og:description", content: "Organize suas descobertas no chromaX." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Salvos });
function SavedContent({ userId }: { userId: string }) {
  const [tab, setTab] = useState("posts");
  const { data } = useSuspenseQuery({ queryKey: ["saved-content", userId], queryFn: async () => {
    const result = await supabase.from("saved_items").select("post_id,product_id").eq("user_id", userId).order("created_at", { ascending: false });
    if (result.error) throw result.error;
    const postIds = result.data.flatMap((r) => r.post_id ? [r.post_id] : []);
    const productIds = result.data.flatMap((r) => r.product_id ? [r.product_id] : []);
    const [posts, products] = await Promise.all([postIds.length ? supabase.from("feed_posts").select("*, profiles(display_name,username,logo_url), post_ups(user_id), post_reposts(user_id)").in("id", postIds) : Promise.resolve({ data: [], error: null }), productIds.length ? supabase.from("products").select("*").in("id", productIds) : Promise.resolve({ data: [], error: null })]);
    if (posts.error) throw posts.error;
    if (products.error) throw products.error;
    return { posts: posts.data ?? [], products: products.data ?? [] };
  } });
  return <><div className="flex gap-2 border-b border-border pb-4"><Button variant={tab === "posts" ? "secondary" : "ghost"} onClick={() => setTab("posts")}>Posts · {data.posts.length}</Button><Button variant={tab === "products" ? "secondary" : "ghost"} onClick={() => setTab("products")}>Produtos · {data.products.length}</Button></div>{tab === "posts" ? data.posts.map((p) => <PostCard key={p.id} post={p} />) : <div className="mt-6 grid gap-4 sm:grid-cols-2">{data.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>}{(tab === "posts" ? data.posts : data.products).length === 0 && <p className="py-20 text-center text-sm text-muted-foreground">Nada salvo por aqui ainda.</p>}</>;
}
function Salvos() {
  const { user, ready } = useCommunity();
  return <main className="min-h-screen pb-32"><SiteHeader /><section className="mx-auto max-w-3xl px-5 py-10"><h1 className="mb-8 flex items-center gap-3 font-display text-2xl"><Bookmark />Salvos</h1>{!ready ? <p>Carregando…</p> : user ? <Suspense fallback={<p>Carregando salvos…</p>}><SavedContent userId={user.id} /></Suspense> : <div className="py-12 text-center"><p className="mb-5 text-muted-foreground">Entre para ver seus posts e produtos salvos.</p><Button asChild><Link to="/auth">Entrar</Link></Button></div>}</section></main>;
}