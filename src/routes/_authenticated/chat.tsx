import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat — chromaX" }, { name: "description", content: "Suas conversas no chromaX." }, { property: "og:title", content: "Chat — chromaX" }, { property: "og:description", content: "Conversas com amigos e contatos do marketplace chromaX." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <SiteHeader />
      <p className="px-5 py-10 font-mono text-sm text-muted-foreground">Chat em construção.</p>
    </main>
  ),
});
