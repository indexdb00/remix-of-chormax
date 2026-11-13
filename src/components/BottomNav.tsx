import { Link } from "@tanstack/react-router";
import { Home, MessageSquare, Camera, UserRound, Search } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/feed", label: "Explorar", icon: Search },
  { to: "camera", label: "Câmera", icon: Camera },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
      <ul className="glass-menu mx-auto grid max-w-md grid-cols-5 rounded-[26px] px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            {to === "camera" ? (
              <button type="button" onClick={() => window.dispatchEvent(new Event("chromax:open-camera"))} aria-label={label} title={label} className="group flex h-12 w-full items-center justify-center rounded-2xl text-zinc-300 transition hover:bg-white/[0.07] hover:text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-b from-white via-zinc-300 to-zinc-500 text-black shadow-[0_4px_18px_rgba(255,255,255,.16),inset_0_1px_1px_rgba(255,255,255,.9)] transition-transform group-hover:scale-105"><Icon size={23} strokeWidth={1.8} /></span>
              </button>
            ) : (
              <Link to={to} activeOptions={{ exact: to === "/" }} aria-label={label} title={label} className="group flex h-12 items-center justify-center rounded-2xl text-zinc-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white" activeProps={{ className: "bg-white/[0.10] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28)]" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-300/20 to-zinc-500/5 text-current transition-transform group-hover:scale-105"><Icon size={21} strokeWidth={1.8} /></span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
