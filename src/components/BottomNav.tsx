import { Link } from "@tanstack/react-router";
import { Home, MessageSquare, Search, UserRound, Globe2 } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/feed", label: "Feed", icon: Globe2 },
  { to: "/explorar", label: "Explorar", icon: Search },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
      <ul className="glass-menu mx-auto grid max-w-md grid-cols-5 rounded-[26px] px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              aria-label={label}
              title={label}
              className="group flex h-12 items-center justify-center rounded-2xl text-zinc-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
              activeProps={{ className: "bg-white/[0.10] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28)]" }}
            >
              <span className={to === "/explorar" ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-b from-white via-zinc-300 to-zinc-500 text-black shadow-[0_4px_18px_rgba(255,255,255,.16),inset_0_1px_1px_rgba(255,255,255,.9)] transition-transform group-hover:scale-105" : "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-300/20 to-zinc-500/5 text-current transition-transform group-hover:scale-105"}>
                <Icon size={to === "/explorar" ? 23 : 21} strokeWidth={1.8} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
