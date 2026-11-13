import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Circle, FlipHorizontal, X, ImagePlus, Square } from "lucide-react";
import { toast } from "sonner";
import { useCommunity } from "./CommunityProvider";

export function CameraSwipe() {
  const { compose } = useCommunity();
  const [open, setOpen] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRecording(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      toast.error("Este navegador não oferece acesso à câmera.");
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setSupported(true);
    } catch {
      setSupported(false);
      toast.error("Não foi possível iniciar a câmera. Você ainda pode escolher uma mídia da galeria.");
    }
  }, [facing, stopCamera]);

  useEffect(() => {
    const openCamera = () => setOpen(true);
    window.addEventListener("chromax:open-camera", openCamera);
    return () => window.removeEventListener("chromax:open-camera", openCamera);
  }, []);

  useEffect(() => {
    if (open) void startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [open, facing, startCamera, stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (facing === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `chromax-${Date.now()}.jpg`, { type: "image/jpeg" });
      stopCamera();
      setOpen(false);
      compose(file);
    }, "image/jpeg", 0.92);
  };

  const toggleRecording = () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") {
      toast.error("Gravação de vídeo não suportada neste navegador.");
      return;
    }
    try {
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        if (blob.size > 50 * 1024 * 1024) {
          toast.error("O vídeo ultrapassa o limite de 50 MB.");
          return;
        }
        const extension = blob.type.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `chromax-${Date.now()}.${extension}`, { type: blob.type });
        stopCamera();
        setOpen(false);
        compose(file);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Não foi possível iniciar a gravação.");
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Câmera ChromaX">
      <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />
      <header className="relative z-10 flex items-center justify-between p-5 pt-[max(20px,env(safe-area-inset-top))]">
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar câmera" className="rounded-full bg-black/35 p-3 backdrop-blur"><X /></button>
        <span className="font-display text-sm font-bold tracking-wider text-chrome-metal">CHROMAX CAMERA</span>
        <button type="button" onClick={() => setFacing((value) => value === "user" ? "environment" : "user")} aria-label="Alternar câmera" className="rounded-full bg-black/35 p-3 backdrop-blur"><FlipHorizontal /></button>
      </header>
      {!supported && <div className="relative z-10 m-auto flex items-center gap-2"><CameraOff /> Câmera indisponível</div>}
      <footer className="relative z-10 mt-auto flex items-center justify-center gap-10 px-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-8">
        <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Escolher mídia da galeria" className="rounded-full bg-black/45 p-4 backdrop-blur"><ImagePlus /></button>
        <button type="button" onClick={recording ? toggleRecording : capturePhoto} aria-label={recording ? "Finalizar gravação" : "Capturar foto"} className="grid h-[76px] w-[76px] place-items-center rounded-full border-[5px] border-white bg-white/15 shadow-xl">
          {recording ? <Square size={25} fill="white" /> : <Circle size={49} fill="white" className="text-white" />}
        </button>
        <button type="button" onClick={toggleRecording} aria-label={recording ? "Parar vídeo" : "Gravar vídeo"} className={`rounded-full p-4 backdrop-blur ${recording ? "bg-red-600" : "bg-black/45"}`}>{recording ? <Square /> : <Camera />}</button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" capture="environment" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) { setOpen(false); compose(file); } event.currentTarget.value = ""; }} />
      </footer>
      {recording && <span className="absolute left-1/2 top-24 z-10 -translate-x-1/2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold tracking-wider">● REC</span>}
    </div>
  );
}
