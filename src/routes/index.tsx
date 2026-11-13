import { createFileRoute } from "@tanstack/react-router";
import { CommunityTimeline } from "@/components/CommunityTimeline";
import { Landing } from "@/components/Landing";
import { useCommunity } from "@/components/CommunityProvider";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ChromaX — Crie, conecte e monetize projetos digitais" },
    { name: "description", content: "A rede para desenvolvedores, criadores e curiosos por tecnologia. Apresente projetos digitais, descubra ferramentas, faça networking e encontre novas oportunidades." },
    { property: "og:title", content: "ChromaX — Crie, conecte e monetize projetos digitais" },
    { property: "og:description", content: "Uma comunidade para mostrar projetos, descobrir criadores e se conectar ao universo Network Dev." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  const { user, ready } = useCommunity();
  if (!ready || !user) return <Landing />;
  return (
    <>
      <CommunityTimeline scope="all" />
    </>
  );
}
