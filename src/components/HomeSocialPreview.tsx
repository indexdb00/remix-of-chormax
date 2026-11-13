import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, CirclePlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useCommunity } from "./CommunityProvider";

type PreviewMode = "both" | "stories" | "notes";

export function HomeSocialPreview() {
  const { user } = useCommunity();
  const [mode, setMode] = useState<PreviewMode>("both");

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
  const media = stories.data ?? [];
  const seen = new Set<string>();
  const storyAuthors = media.filter((post) => {
    if (seen.has(post.author_id)) return false;
    seen.add(post.author_id);
    return true;
  }).slice(0, 10);

  const showNotes = mode !== "stories";
  const showStories = mode !== "notes";

  return (
    <section className="sticky top-[68px] z-30 border-b border-white/10 bg-[#0d0d11]/98 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,.3)] backdrop-blur-2xl sm:px-6" aria-label="Notas e stories">
      <div className="mx-auto max-w-6xl">\n        <div className="mb-2 flex items-center justify-end gap-1.5">\n          <button type="button" onClick={() => setMode("both")} aria-pressed={mode === "both"} className={`rounded-full px-2.5 py-1 text-[10px] transition ${mode === "both" ? "bg-white/15 text-white" : "text-white/45 hover:text-white"}`}>Tudo</button>\n          <button type="button" onClick={() => setMode("notes")} aria-pressed={mode === "notes"} className={`rounded-full px-2.5 py-1 text-[10px] transition ${mode === "notes" ? "bg-white/15 text-white" : "text-white/45 hover:text-white"}`}>Notas</button>\n          <button type="button" onClick={() => setMode("stories")} aria-pressed={mode === "stories"} className={`rounded-full px-2.5 py-1 text-[10px] transition ${mode === "stories" ? "bg-white/15 text-white" : "text-white/45 hover:text-white"}`}>Stories</button>\n        </div>
        {showNotes && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold tracking-wide text-white/85">Notas</h2>
              <span className="text-[10px] text-white/35">Comunidade</span>
            </div>
            <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
              {user && <button type="button" onClick={() => window.dispatchEvent(new Event("chromax:open-camera"))} className="flex min-w-[176px] max-w-[200px] items-center gap-3 rounded-xl border border-white/15 bg-white/[.04] p-2.5 text-left">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-white/35 text-white/70"><CirclePlus size={18}/></span>
                <span className="min-w-0"><span className="block text-[11px] font-semibold text-white">Sua nota</span><span className="block text-[10px] text-white/45">Compartilhe uma ideia</span></span>
              </button>}
              {notes.data?.slice(0, 8).map((profile) => (
                <div key={profile.id} className="flex min-w-[176px] max-w-[200px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.025] p-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-xs text-white">{profile.logo_url ? <img src={profile.logo_url} alt="" className="h-full w-full object-cover"/> : (profile.display_name || profile.username || "?").slice(0,1).toUpperCase()}</span>
                  <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-white">{profile.display_name || profile.username || "Membro"}</span><span className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-white/50">{profile.bio}</span></span>
                </div>
              ))}
              {!notes.isLoading && !notes.data?.length && <p className="py-3 text-[11px] text-white/40">As notas da comunidade aparecerão aqui.</p>}
            </div>
          </div>
        )}
        {showStories && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold tracking-wide text-white/85">Stories</h2>
              <span className="text-[10px] text-white/35">Comunidade</span>
            </div>
            <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
              {user && <button type="button" onClick={() => window.dispatchEvent(new Event("chromax:open-camera"))} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5">
                <span className="grid h-[58px] w-[58px] place-items-center rounded-full border border-dashed border-white/50 bg-white/[.04] text-white/75"><Camera size={21}/></span>
                <span className="max-w-full truncate text-[10px] text-white/65">Seu story</span>
              </button>}
              {storyAuthors.map((post) => {
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                const name = profile?.display_name || profile?.username || "Membro";
                return <Link key={post.author_id} to="/post/$id" params={{ id: post.id }} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5">
                  <span className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-full border-2 border-white/80 bg-gradient-to-br from-zinc-200/30 to-zinc-700 p-[3px]">
                    <span className="h-full w-full overflow-hidden rounded-full bg-[#111]">{profile?.logo_url ? <img src={profile.logo_url} alt="" className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center text-xs text-white">{name.slice(0,1).toUpperCase()}</span>}</span>
                  </span>
                  <span className="max-w-full truncate text-[10px] text-white/65">{name}</span>
                </Link>;
              })}
              {!stories.isLoading && !storyAuthors.length && <p className="py-4 text-[11px] text-white/40">Os stories da comunidade aparecerão aqui.</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
