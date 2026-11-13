import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { PostCard } from "@/components/PostCard";
import type { CommunityPost } from "@/lib/community";

const postQuery = (id: string) =>
  queryOptions({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("feed_posts").select("*, profiles(display_name,username,logo_url), post_ups(user_id), post_reposts(user_id)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as CommunityPost | null;
    },
  });

export const Route = createFileRoute("/post/$id")({
  head: () => ({
    meta: [
      { title: "Publicação — chromaX" },
      { name: "description", content: "Veja uma publicação da comunidade chromaX." },
      { property: "og:title", content: "Publicação — chromaX" },
      { property: "og:description", content: "Publicação da comunidade chromaX." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(postQuery(params.id)),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(id));
  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-2xl">
        <Link to="/feed" className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground"><ArrowLeft size={16} /> Projetos</Link>
        {data ? <PostCard post={data} /> : <p className="p-10 text-center text-sm text-muted-foreground">Publicação não encontrada.</p>}
      </section>
    </main>
  );
}
