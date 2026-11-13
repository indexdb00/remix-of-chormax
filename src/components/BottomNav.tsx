import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Send, Plus, UserRound, Search } from "lucide-react";
import { useCommunity } from "./CommunityProvider";

const items = [
  { to: "/", label: "Aprender", icon: Home },
  { to: "/feed", label: "Projetos", icon: Search },
  { to: "compose", label: "Publicar", icon: Plus },
  { to: "/chat", label: "Comunidade", icon: Send },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function BottomNav() {
  const { compose, user } = useCommunity();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!user || pathname.startsWith("/creator")) return null;
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
      <ul className="glass-menu mx-auto grid max-w-md grid-cols-5 rounded-[20px] px-1.5 py-1.5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            {to === "compose" ? (
              <button type="button" onClick={() => compose()} aria-label="Criar publicação" title="Criar publicação" className="group flex h-11 w-full items-center justify-center rounded-xl text-zinc-300 transition hover:bg-white/[0.07] hover:text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black transition-transform group-hover:scale-105"><Plus size={22} strokeWidth={2}/></span>
              </button>
            ) : (
              <Link to={to} activeOptions={{ exact: to === "/" }} aria-label={label} title={label} className="group flex h-11 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/[0.07] hover:text-white" activeProps={{ className: "bg-white/[0.10] text-white" }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-current transition-transform group-hover:scale-105">{to === "/chat" ? <Send size={20} strokeWidth={1.8}/> : <Icon size={20} strokeWidth={1.8}/>}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
