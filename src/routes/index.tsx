import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, X } from "lucide-react";
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
  const [cameraBubbleVisible, setCameraBubbleVisible] = useState(true);
  if (!ready || !user) return <Landing />;
  return (
    <>
      <CommunityTimeline scope="friends" />
      {cameraBubbleVisible && (
        <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-1 rounded-full border border-white/20 bg-gradient-to-b from-zinc-200/95 to-zinc-400/95 p-1 pl-4 text-black shadow-[0_12px_40px_rgba(255,255,255,.18)] backdrop-blur-xl sm:bottom-8 sm:right-8">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("chromax:open-camera"))}
            className="inline-flex min-h-11 items-center gap-2 pr-2 text-xs font-semibold tracking-wide"
            aria-label="Abrir câmera"
          >
            <Camera size={18} strokeWidth={2.2} />
            <span>Câmera</span>
          </button>
          <span className="h-6 w-px bg-black/15" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setCameraBubbleVisible(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-black/65 transition hover:bg-black/10 hover:text-black"
            aria-label="Fechar atalho da câmera"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
