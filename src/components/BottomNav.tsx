import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Send, Plus, UserRound, Search } from "lucide-react";
import { useCommunity } from "./CommunityProvider";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/feed", label: "Explorar", icon: Search },
  { to: "compose", label: "Publicar", icon: Plus },
  { to: "/chat", label: "Mensagens", icon: Send },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function BottomNav() {
  const { compose } = useCommunity();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.startsWith("/creator")) return null;
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
      <ul className="glass-menu mx-auto grid max-w-md grid-cols-5 rounded-[22px] px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            {to === "compose" ? (
              <button type="button" onClick={() => compose()} aria-label="Criar publicação" title="Criar publicação" className="group flex h-12 w-full items-center justify-center rounded-2xl text-zinc-300 transition hover:bg-white/[0.07] hover:text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-[0_3px_14px_rgba(255,255,255,.12)] transition-transform group-hover:scale-105"><Plus size={23} strokeWidth={2} /></span>
              </button>
            ) : (
              <Link to={to} activeOptions={{ exact: to === "/" }} aria-label={label} title={label} className="group flex h-12 items-center justify-center rounded-2xl text-zinc-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white" activeProps={{ className: "bg-white/[0.10] text-white" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-current transition-transform group-hover:scale-105">{to === "/chat" ? <Send size={22} strokeWidth={1.8} /> : <Icon size={21} strokeWidth={1.8} />}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
