import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";
import { AcademyDashboard } from "@/components/AcademyDashboard";
import { useCommunity } from "@/components/CommunityProvider";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ChromaX — Escola digital de tecnologia e criatividade" },
    { name: "description", content: "Aprenda inteligência artificial, desenvolvimento, design e cibersegurança com trilhas e projetos práticos." },
    { property: "og:title", content: "ChromaX — Aprenda. Construa. Evolua." },
    { property: "og:description", content: "Uma jornada prática por IA, código, design e segurança digital." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  const { user, ready } = useCommunity();
  if (!ready) return <div className="min-h-screen bg-[#090909]" />;
  if (!user) return <Landing />;
  return <AcademyDashboard user={user} />;
}
