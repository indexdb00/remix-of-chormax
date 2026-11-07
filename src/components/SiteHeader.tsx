import { Link } from "@tanstack/react-router";
import { Plus, Bookmark, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommunity } from "./CommunityProvider";

export function SiteHeader() {
  const { user, compose } = useCommunity();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid h-20 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <div><Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-secondary hover:text-foreground"><Link to={user ? "/perfil" : "/auth"} aria-label={user ? "Meu perfil" : "Entrar"} title={user ? "Meu perfil" : "Entrar"}><User /></Link></Button></div>
        <Link to="/" className="font-display text-xl font-extrabold text-chrome sm:text-2xl">chromaX</Link>
        <nav className="flex justify-end gap-1 sm:gap-3" aria-label="Ações rápidas"><Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary hover:text-foreground" aria-label="Criar post" title="Criar post" onClick={compose}><Plus /></Button><Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-secondary hover:text-foreground"><Link to="/salvos" aria-label="Salvos" title="Salvos"><Bookmark /></Link></Button></nav>
      </div>
    </header>
  );
}
