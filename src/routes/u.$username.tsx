import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useCommunity } from "@/components/CommunityProvider";
import { PostCard } from "@/components/PostCard";
import type { CommunityPost } from "@/lib/community";

export const Route = createFileRoute("/u/$username")({ component: PublicProfile });

function PublicProfile() {
  const { username } = Route.useParams();
  const { user } = useCommunity();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["public-profile-posts", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("feed_posts").select("*, profiles(display_name,username,logo_url), post_ups(user_id), post_reposts(user_id)").eq("author_id", profile!.id).eq("archived", false).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CommunityPost[];
    },
  });
  const { data: followers = 0 } = useQuery({
    queryKey: ["followers-count", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => (await supabase.from("profile_follows").select("id", { count: "exact", head: true }).eq("following_id", profile!.id)).count ?? 0,
  });
  const { data: following = 0 } = useQuery({
    queryKey: ["following-count", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => (await supabase.from("profile_follows").select("id", { count: "exact", head: true }).eq("follower_id", profile!.id)).count ?? 0,
  });
  const { data: follows = false } = useQuery({
    queryKey: ["is-following", user?.id, profile?.id],
    enabled: !!user && !!profile?.id && user.id !== profile.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profile_follows").select("id").eq("follower_id", user!.id).eq("following_id", profile!.id).maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
  async function toggleFollow() {
    if (!user || !profile || busy) return;
    setBusy(true);
    const result = follows
      ? await supabase.from("profile_follows").delete().eq("follower_id", user.id).eq("following_id", profile.id)
      : await supabase.from("profile_follows").insert({ follower_id: user.id, following_id: profile.id });
    setBusy(false);
    if (result.error) toast.error("Não foi possível atualizar o seguimento.");
    else {
      await qc.invalidateQueries({ queryKey: ["is-following", user.id, profile.id] });
      await qc.invalidateQueries({ queryKey: ["followers-count", profile.id] });
      toast.success(follows ? "Você deixou de seguir." : "Agora você está seguindo.");
    }
  }
  if (isLoading) return <main className="min-h-screen bg-background text-foreground"><SiteHeader /><p className="p-10 text-center text-sm text-muted-foreground">Carregando perfil…</p></main>;
  if (!profile) return <main className="min-h-screen bg-background text-foreground"><SiteHeader /><p className="p-10 text-center text-sm text-muted-foreground">Perfil não encontrado.</p></main>;
  const own = user?.id === profile.id;
  const name = profile.display_name || profile.username || "Membro";
  return <main className="min-h-screen bg-background pb-32 text-foreground">
    <SiteHeader />
    <section className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <Link to="/feed" className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft size={15}/> Explorar</Link>
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-card">{profile.logo_url ? <img src={profile.logo_url} alt={name} className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center text-3xl font-bold">{name[0]?.toUpperCase()}</span>}</div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <div className="mt-2 flex gap-4 text-xs"><span><b>{followers}</b> seguidores</span><span><b>{following}</b> seguindo</span></div>
        </div>
      </div>
      {profile.bio && <p className="mt-4 whitespace-pre-wrap text-sm">{profile.bio}</p>}
      {user && !own && <button onClick={toggleFollow} disabled={busy} className="mt-4 inline-flex min-w-36 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[.08] px-5 py-2.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50">{follows ? <><UserCheck size={15}/> Seguindo</> : <><UserPlus size={15}/> Seguir</>}</button>}
      {!user && <Link to="/auth" className="mt-4 inline-flex rounded-xl border border-white/25 px-5 py-2.5 text-xs font-semibold">Entrar para seguir</Link>}
      <div className="mt-6 border-t border-border">{posts.length ? posts.map(post => <PostCard key={post.id} post={post}/>) : <p className="p-10 text-center text-sm text-muted-foreground">Nenhuma publicação ainda.</p>}</div>
    </section>
  </main>;
}
