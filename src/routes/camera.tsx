import { createFileRoute } from "@tanstack/react-router";
import { Camera, ImagePlus, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/camera")({
  head: () => ({
    meta: [
      { title: "Câmera — chromaX" },
      { name: "description", content: "Capture fotos e vídeos e compartilhe com a comunidade chromaX." },
    ],
  }),
  component: CameraPage,
});

function CameraPage() {
  const openCamera = () => {
    window.dispatchEvent(new Event("chromax:open-camera"));
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100dvh-68px)] w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-7 grid h-24 w-24 place-items-center rounded-[2rem] border border-white/15 bg-gradient-to-br from-white/15 to-white/[.02] shadow-[0_20px_80px_rgba(255,255,255,.08)]">
          <Camera size={42} strokeWidth={1.25} className="text-zinc-100" />
        </div>
        <p className="mb-3 font-mono text-[10px] tracking-[.35em] text-white/45">CHROMAX / CAPTURE</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Sua próxima ideia começa aqui.</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-white/55 sm:text-base">
          Capture uma foto ou vídeo com a câmera do dispositivo ou escolha uma mídia da galeria para publicar na comunidade.
        </p>
        <button
          type="button"
          onClick={openCamera}
          className="mt-9 inline-flex items-center gap-3 rounded-full border border-white/30 bg-gradient-to-b from-white to-zinc-300 px-7 py-4 text-sm font-bold text-black shadow-[0_8px_35px_rgba(255,255,255,.12)] transition hover:scale-[1.02]"
        >
          <Camera size={18} /> Abrir câmera
        </button>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-[11px] text-white/45">
          <span className="inline-flex items-center gap-2"><ImagePlus size={15} /> Fotos e vídeos da galeria</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Permissão solicitada pelo navegador</span>
        </div>
      </main>
    </div>
  );
}
