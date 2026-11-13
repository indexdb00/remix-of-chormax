import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Plus, Repeat2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCommunity } from "./CommunityProvider";

type PreviewMode = "notes" | "stories";

export function HomeSocialPreview() {
  const { user, compose, composeStory } = useCommunity();
  const [activeStory, setActiveStory] = useState<any>(null);
  const [mode, setMode] = useState<PreviewMode>("stories");

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
      const { data, error } = await supabase.from("stories")
        .select("id,media_url,media_type,author_id,created_at,expires_at,profiles(display_name,username,logo_url)")
        .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(40);
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

  const switchMode = () => setMode((current) => current === "stories" ? "notes" : "stories");

  return (
    <section className="border-b border-white/[.08] bg-[#0d0d11]/95 px-4 py-3 backdrop-blur-xl sm:px-6" aria-label="Notas e stories">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/55">{mode === "stories" ? "Stories" : "Notas"}</h2>
            <span className="text-[10px] text-white/25">/</span>
            <span className="text-[10px] text-white/35">{mode === "stories" ? "Momentos recentes" : "Da comunidade"}</span>
          </div>
          <button type="button" onClick={switchMode} aria-label={mode === "stories" ? "Trocar para notas" : "Trocar para stories"} title={mode === "stories" ? "Ver notas" : "Ver stories"} className="group grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[.045] text-white/65 transition duration-300 hover:rotate-180 hover:border-white/35 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
            <Repeat2 size={16} className="transition-transform duration-300 group-hover:rotate-[-180deg]" />
          </button>
        </div>

        <div key={mode} className="min-h-[66px] animate-in fade-in slide-in-from-right-2 duration-300">
          {mode === "notes" ? (
            <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-0.5">
              {user && <button type="button" onClick={() => compose()} className="flex h-11 min-w-[132px] shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[.045] px-2.5 text-left transition hover:bg-white/[.08]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-white/35 text-white/70"><Plus size={15}/></span>
                <span className="text-[11px] font-medium text-white/75">Sua nota</span>
              </button>}
              {notes.data?.slice(0, 8).map((profile) => (
                <div key={profile.id} className="flex h-11 min-w-[148px] max-w-[180px] shrink-0 items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-[10px] text-white/80">{profile.logo_url ? <img src={profile.logo_url} alt="" className="h-full w-full object-cover"/> : (profile.display_name || profile.username || "?").slice(0,1).toUpperCase()}</span>
                  <span className="min-w-0"><span className="block truncate text-[10px] font-medium text-white/75">{profile.display_name || profile.username || "Membro"}</span><span className="block truncate text-[10px] text-white/40">{profile.bio}</span></span>
                </div>
              ))}
              {!notes.isLoading && !notes.data?.length && <p className="py-2 text-[11px] text-white/35">Nenhuma nota por enquanto.</p>}
            </div>
          ) : (
            <div className="scrollbar-none flex items-start gap-4 overflow-x-auto pb-0.5">
              {user && <button type="button" onClick={() => window.dispatchEvent(new Event("chromax:open-story-camera"))} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                <span className="relative grid h-12 w-12 place-items-center rounded-full border border-dashed border-white/45 bg-white/[.04] text-white/75"><Camera size={18}/><span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-[#0d0d11] bg-white text-[#0d0d11]"><Plus size={10}/></span></span>
                <span className="max-w-full truncate text-[10px] text-white/55">Seu story</span>
              </button>}
              {storyAuthors.map((post) => {
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                const name = profile?.display_name || profile?.username || "Membro";
                return <button key={post.author_id} type="button" onClick={() => setActiveStory(post)} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-white/80 via-white/35 to-white/10 p-[2px]"><span className="h-full w-full overflow-hidden rounded-full border-2 border-[#0d0d11] bg-[#17171c]">{profile?.logo_url ? <img src={profile.logo_url} alt="" className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center text-xs text-white/80">{name.slice(0,1).toUpperCase()}</span>}</span></span>
                  <span className="max-w-full truncate text-[10px] text-white/55">{name}</span>
                </button>;
              })}
              {!stories.isLoading && !storyAuthors.length && <p className="py-3 text-[11px] text-white/35">Nenhum story por enquanto.</p>}
            </div>
          )}
        </div>
      </div>
      {activeStory && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-3" role="dialog" aria-modal="true" onClick={() => setActiveStory(null)}><div className="relative flex h-[min(86vh,760px)] w-full max-w-md items-center justify-center overflow-hidden rounded-2xl bg-[#111]" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setActiveStory(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-2 text-sm text-white">Fechar</button>{activeStory.media_type === "video" ? <video src={activeStory.media_url} autoPlay controls playsInline className="h-full w-full object-contain" /> : <img src={activeStory.media_url} alt="Story" className="h-full w-full object-contain" />}</div></div>}
    </section>
  );
}
