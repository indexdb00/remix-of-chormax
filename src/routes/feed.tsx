import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Feed da comunidade — chromaX" },
      { name: "description", content: "Conversas, pedidos de ajuda e pré-vendas da comunidade chromaX." },
      { property: "og:title", content: "Feed da comunidade — chromaX" },
      { property: "og:description", content: "A comunidade gamer do chromaX conversando." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <SiteHeader />
      <p className="px-5 py-10 font-mono text-sm text-muted-foreground">Feed em construção.</p>
    </main>
  ),
});
