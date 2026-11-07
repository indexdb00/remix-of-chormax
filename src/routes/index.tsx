import { createFileRoute } from "@tanstack/react-router";
import { CommunityTimeline } from "@/components/CommunityTimeline";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Início · Seus amigos — chromaX" },
    { name: "description", content: "Acompanhe posts e conversas dos seus amigos na comunidade digital chromaX." },
    { property: "og:title", content: "Início · Seus amigos — chromaX" },
    { property: "og:description", content: "Sua comunidade de amigos, games e criação digital." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <CommunityTimeline scope="friends" />,
});
