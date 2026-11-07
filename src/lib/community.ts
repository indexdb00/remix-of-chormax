import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { acceptedFriendIds } from "./community-rules";
import type { Database } from "@/integrations/supabase/types";

export const postsQuery = (scope: "global" | "friends", userId?: string) => queryOptions({
  queryKey: ["posts", scope, userId],
  queryFn: async () => {
    let query = supabase.from("feed_posts").select("*, profiles(display_name,username,logo_url)").order("created_at", { ascending: false }).limit(100);
    if (scope === "friends") {
      if (!userId) return [];
      const { data, error } = await supabase.from("friendships").select("*").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
      if (error) throw error;
      const ids = acceptedFriendIds(data ?? [], userId);
      if (!ids.length) return [];
      query = query.in("author_id", ids);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
});
export type CommunityPost = Database["public"]["Tables"]["feed_posts"]["Row"] & { profiles: { display_name: string | null; username: string | null; logo_url: string | null } | null };