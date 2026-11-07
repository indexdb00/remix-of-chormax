import { createFileRoute } from "@tanstack/react-router";
import { CommunityTimeline } from "@/components/CommunityTimeline";
import { Landing } from "@/components/Landing";
import { useCommunity } from "@/components/CommunityProvider";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "chromaX — Rede social gamer, mídia e networking" },
    { name: "description", content: "Conecte-se com amigos, compartilhe mídia, dê Up e reposte, e negocie itens digitais na chromaX." },
    { property: "og:title", content: "chromaX — Rede social gamer, mídia e networking" },
    { property: "og:description", content: "Amigos no Início, descobertas no Feed e chat integrado." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  const { user, ready } = useCommunity();
  if (!ready || !user) return <Landing />;
  return <CommunityTimeline scope="friends" />;
}
