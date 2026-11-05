import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-12">
      <Link to="/" className="font-display text-xl font-extrabold">chroma<span className="text-chrome">X</span></Link>
      <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-wider">
        <Link to="/explorar" className="hover:text-accent" activeProps={{ className: "text-accent" }}>Explorar</Link>
        {signedIn ? (
          <Link to="/perfil" className="inline-flex items-center gap-2 border border-border px-4 py-2 hover:bg-primary hover:text-primary-foreground">
            <User size={14} /> Perfil
          </Link>
        ) : (
          <Link to="/auth" className="inline-flex items-center gap-2 border border-border px-4 py-2 hover:bg-primary hover:text-primary-foreground">
            Entrar <ArrowRight size={14} />
          </Link>
        )}
      </nav>
    </header>
  );
}
