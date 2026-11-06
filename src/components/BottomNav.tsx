import { Link } from "@tanstack/react-router";
import { Home, MessageSquare, Rss, Sparkles, User } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/feed", label: "Feed", icon: Rss },
  { to: "/creator", label: "Creator", icon: Sparkles },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-3 font-mono text-[10px] uppercase text-muted-foreground"
              activeProps={{ className: "text-accent" }}
            >
              <Icon size={18} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
