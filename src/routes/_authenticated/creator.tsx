import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/creator")({
  head: () => ({ meta: [{ title: "Creator — chromaX" }, { name: "description", content: "Publique seus itens digitais." }] }),
  component: () => (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <SiteHeader />
      <p className="px-5 py-10 font-mono text-sm text-muted-foreground">Área Creator em construção.</p>
    </main>
  ),
});
