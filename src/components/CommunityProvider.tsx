import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const CommunityContext = createContext<{ user: User | null; ready: boolean; compose: (file?: File) => void; draftFile: File | null; composing: boolean; closeCompose: () => void }>({ user: null, ready: false, compose: () => {}, draftFile: null, composing: false, closeCompose: () => {} });
export const useCommunity = () => useContext(CommunityContext);
export function CommunityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const qc = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null); setReady(true);
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      // Schedule outside the auth callback to avoid re-entering the auth lock.
      setTimeout(() => { router.invalidate(); if (event !== "SIGNED_OUT") qc.invalidateQueries(); }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [qc, router]);
  return <CommunityContext.Provider value={{ user, ready, composing, draftFile, compose: (file) => { setDraftFile(file ?? null); setComposing(true); }, closeCompose: () => { setComposing(false); setDraftFile(null); } }}>{children}</CommunityContext.Provider>;
}