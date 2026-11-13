import { useQuery } from "@tanstack/react-query";
import { Camera, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useCommunity } from "./CommunityProvider";

export function HomeSocialPreview() {
  const { user } = useCommunity();

  const notes = useQuery({
    queryKey: ["home-note-previews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("id,display_name,username,logo_url,bio")
        .not("bio", "is", null).neq("bio", "").limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });
  const stories = useQuery({
    queryKey: ["home-story-previews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feed_posts")
        .select("id,body,image_url,author_id,profiles(display_name,username,logo_url)")
        .eq("archived", false).not("image_url", "is", null)
        .order("created_at", { ascending: false }).limit(16);
      if (error) throw error;
      return data ?? [];
    },
  });

  const seen = new Set<string>();
  const storyAuthors = (stories.data ?? []).filter((post) => {
    if (seen.has(post.author_id)) return false;
    seen.add(post.author_id);
    return true;
  }).slice(0, 10);

  return (
    <section className="sticky top-[64px] z-30 border-b border-white/[.08] bg-[#0d0d11]/95 px-4 py-3 backdrop-blur-xl sm:px-6" aria-label="Notas e stories">
      <div className="mx-auto max-w-6xl space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/45">Notas</h2>
            <span className="text-[10px] text-white/25">Da comunidade</span>
          </div>
          <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-0.5">
            {user && (
              <button type="button" onClick={() => window.dispatchEvent(new Event("chromax:open-camera"))} className="flex h-11 min-w-[132px] shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[.045] px-2.5 text-left transition hover:bg-white/[.08]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-white/35 text-white/70"><Plus size={15}/></span>
                <span className="text-[11px] font-medium text-white/75">Sua nota</span>
              </button>
            )}
            {notes.data?.slice(0, 8).map((profile) => (
              <div key={profile.id} className="flex h-11 min-w-[148px] max-w-[180px] shrink-0 items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-[10px] text-white/80">
                  {profile.logo_url ? <img src={profile.logo_url} alt="" className="h-full w-full object-cover"/> : (profile.display_name || profile.username || "?").slice(0,1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-medium text-white/75">{profile.display_name || profile.username || "Membro"}</span>
                  <span className="block truncate text-[10px] text-white/40">{profile.bio}</span>
                </span>
              </div>
            ))}
            {!notes.isLoading && !notes.data?.length && <p className="py-2 text-[11px] text-white/35">Nenhuma nota por enquanto.</p>}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/45">Stories</h2>
            <span className="text-[10px] text-white/25">Momentos recentes</span>
          </div>
          <div className="scrollbar-none flex items-start gap-4 overflow-x-auto pb-0.5">
            {user && (
              <button type="button" onClick={() => window.dispatchEvent(new Event("chromax:open-camera"))} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                <span className="relative grid h-12 w-12 place-items-center rounded-full border border-dashed border-white/45 bg-white/[.04] text-white/75">
                  <Camera size={18}/>
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-[#0d0d11] bg-white text-[#0d0d11]"><Plus size={10}/></span>
                </span>
                <span className="max-w-full truncate text-[10px] text-white/55">Seu story</span>
              </button>
            )}
            {storyAuthors.map((post) => {
              const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              const name = profile?.display_name || profile?.username || "Membro";
              return (
                <Link key={post.author_id} to="/post/$id" params={{ id: post.id }} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-white/80 via-white/35 to-white/10 p-[2px]">
                    <span className="h-full w-full overflow-hidden rounded-full border-2 border-[#0d0d11] bg-[#17171c]">
                      {profile?.logo_url ? <img src={profile.logo_url} alt="" className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center text-xs text-white/80">{name.slice(0,1).toUpperCase()}</span>}
                    </span>
                  </span>
                  <span className="max-w-full truncate text-[10px] text-white/55">{name}</span>
                </Link>
              );
            })}
            {!stories.isLoading && !storyAuthors.length && <p className="py-3 text-[11px] text-white/35">Nenhum story por enquanto.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
