import { createFileRoute } from "@tanstack/react-router";
import { CommunityTimeline } from "@/components/CommunityTimeline";
import { postsQuery } from "@/lib/community";
export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [
    { title: "Feed global — chromaX" },
    { name: "description", content: "Posts, pedidos de ajuda e pré-vendas de toda a comunidade chromaX." },
    { property: "og:title", content: "Feed global — chromaX" },
    { property: "og:description", content: "Conheça quem cria e joga na comunidade digital chromaX." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery("global")),
  component: () => <CommunityTimeline scope="global" />,
});
