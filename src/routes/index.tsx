import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";
import { PaymentDashboard } from "@/components/PaymentDashboard";
import { useCommunity } from "@/components/CommunityProvider";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ChromaX — Marketplace e pagamentos digitais" },
    { name: "description", content: "Venda SaaS, serviços e produtos digitais com uma experiência profissional." },
    { property: "og:title", content: "ChromaX — Marketplace e pagamentos digitais" },
    { property: "og:description", content: "Um ecossistema para vender e descobrir SaaS, serviços e produtos digitais." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  const { user, ready } = useCommunity();
  if (!ready) return <div className="min-h-screen bg-[#090909]" />;
  if (!user) return <Landing />;
  return <PaymentDashboard user={user} />;
}
