import { Link } from "@tanstack/react-router";
import { Home, MessageSquare, Globe2, Search, User } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/feed", label: "Feed", icon: Globe2 },
  { to: "/explorar", label: "Explorar", icon: Search },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="Menu principal" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
      <ul className="glass-menu mx-auto grid max-w-lg grid-cols-5 rounded-full px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              aria-label={label}
              title={label}
              className="group flex h-14 flex-col items-center justify-center gap-1 rounded-full text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-primary/10 text-primary" }}
            >
              <span className={to === "/explorar" ? "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-sm" : "flex h-6 items-center justify-center"}><Icon size={to === "/explorar" ? 22 : 20} /></span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
