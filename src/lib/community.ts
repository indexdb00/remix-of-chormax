import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { acceptedFriendIds } from "./community-rules";
import type { Database } from "@/integrations/supabase/types";

export const POST_SELECT = "*, profiles(display_name,username,logo_url), post_ups(user_id), post_reposts(user_id)";

async function friendIds(userId: string) {
  const { data, error } = await supabase.from("friendships").select("*").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  return acceptedFriendIds(data ?? [], userId);
}

/** friends = you + accepted friends (posts and their reposts). global = everyone else. */
export const postsQuery = (scope: "global" | "friends" | "all", userId?: string) => queryOptions({
  queryKey: ["posts", scope, userId],
  queryFn: async (): Promise<CommunityPost[]> => {
    let query = supabase.from("feed_posts").select(POST_SELECT).eq("archived", false).order("created_at", { ascending: false }).limit(100);
    if (scope === "all") { /* Unified home timeline: include friends and the wider community. */ }
    else if (scope === "friends") {
      if (!userId) return [];
      const ids = [...(await friendIds(userId)), userId];
      const { data: reps } = await supabase.from("post_reposts").select("post_id").in("user_id", ids).limit(100);
      const repIds = (reps ?? []).map((r) => r.post_id);
      query = repIds.length ? query.or(`author_id.in.(${ids.join(",")}),id.in.(${repIds.join(",")})`) : query.in("author_id", ids);
    } else if (userId) {
      const ids = [...(await friendIds(userId)), userId];
      query = query.not("author_id", "in", `(${ids.join(",")})`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as CommunityPost[];
  },
});

export type CommunityPost = Database["public"]["Tables"]["feed_posts"]["Row"] & {
  profiles: { display_name: string | null; username: string | null; logo_url: string | null } | null;
  post_ups?: { user_id: string }[];
  post_reposts?: { user_id: string }[];
};
