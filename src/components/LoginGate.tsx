import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { playNotify } from "@/lib/sound";

type Ann = { id: string; title: string; body: string; image_url: string | null; button_label: string; button_link: string };

/** Runs for signed-in users: terms acceptance, news balloon, presence and message notifications. */
export function LoginGate() {
  const [userId, setUserId] = useState<string | null>(null);
  const [needsTerms, setNeedsTerms] = useState(false);
  const [ann, setAnn] = useState<Ann | null>(null);
  const shownThisSession = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      setUserId(s?.user.id ?? null);
      if (e === "SIGNED_IN") shownThisSession.current = false;
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // terms + announcement
  useEffect(() => {
    if (!userId) { setNeedsTerms(false); setAnn(null); return; }
    (async () => {
      const { data: p } = await supabase.from("profiles").select("terms_accepted_at").eq("id", userId).maybeSingle();
      if (!p?.terms_accepted_at) { setNeedsTerms(true); return; }
      if (shownThisSession.current) return;
      const [{ data: anns }, { data: dis }] = await Promise.all([
        supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).limit(5),
        supabase.from("announcement_dismissals").select("announcement_id").eq("user_id", userId),
      ]);
      const hidden = new Set((dis ?? []).map((d) => d.announcement_id));
      const next = (anns ?? []).find((a) => !hidden.has(a.id));
      if (next) { setAnn(next); shownThisSession.current = true; }
    })();
  }, [userId, needsTerms]);

  // presence heartbeat + new message notifier
  useEffect(() => {
    if (!userId) return;
    let since = new Date().toISOString();
    const beat = () => supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
    const poll = async () => {
      const { data } = await supabase.from("chat_messages").select("id, chat_id, body, kind, created_at").neq("sender_id", userId).gt("created_at", since).order("created_at");
      if (data?.length) {
        since = data[data.length - 1].created_at;
        const onChat = window.location.pathname.startsWith("/chat");
        playNotify(data.some((m) => m.kind === "sale") ? "sale" : "chat");
        if (!onChat) toast("Nova mensagem", { description: data[data.length - 1].body.slice(0, 80) });
      }
    };
    beat();
    const b = setInterval(beat, 60_000);
    const p = setInterval(poll, 5_000);
    return () => { clearInterval(b); clearInterval(p); };
  }, [userId]);

  if (!userId) return null;
  if (needsTerms) return <TermsModal userId={userId} onDone={() => setNeedsTerms(false)} />;
  if (ann) return <AnnouncementBalloon ann={ann} userId={userId} onClose={() => setAnn(null)} />;
  return null;
}

function TermsModal({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [read, setRead] = useState(false);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setRead(true);
  };
  async function accept() {
    const { error } = await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("id", userId);
    if (error) toast.error("Não foi possível salvar"); else onDone();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col border border-border bg-card">
        <div className="border-b border-border p-5">
          <p className="font-mono text-xs text-accent">[ TERMOS DE USO ]</p>
          <h2 className="mt-1 font-display text-xl font-extrabold uppercase">Leia até o final</h2>
        </div>
        <div onScroll={onScroll} className="flex-1 space-y-4 overflow-y-auto p-5 text-sm text-muted-foreground">
          {TERMS.map(([t, d]) => (
            <div key={t}><p className="font-display text-sm font-extrabold text-foreground">{t}</p><p className="mt-1">{d}</p></div>
          ))}
          <p className="font-mono text-xs text-accent">— Fim dos termos —</p>
        </div>
        <div className="border-t border-border p-5">
          <button disabled={!read} onClick={accept} className="w-full bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground disabled:opacity-30">
            {read ? "Li e concordo" : "Role até o final para confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementBalloon({ ann, userId, onClose }: { ann: Ann; userId: string; onClose: () => void }) {
  const [never, setNever] = useState(false);
  const navigate = useNavigate();
  async function close() {
    if (never) await supabase.from("announcement_dismissals").insert({ user_id: userId, announcement_id: ann.id });
    onClose();
  }
  const external = /^https?:\/\//.test(ann.button_link);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 pb-24 sm:items-center">
      <div className="relative w-full max-w-sm border border-primary bg-card">
        <button onClick={close} aria-label="Fechar" className="absolute right-2 top-2 bg-background/80 p-1"><X size={16} /></button>
        {ann.image_url && <img src={ann.image_url} alt="" className="aspect-video w-full object-cover" />}
        <div className="p-5">
          <p className="font-mono text-xs text-accent">[ NOVIDADE ]</p>
          <h3 className="mt-1 font-display text-lg font-extrabold uppercase">{ann.title}</h3>
          {ann.body && <p className="mt-2 text-sm text-muted-foreground">{ann.body}</p>}
          {external ? (
            <a href={ann.button_link} target="_blank" rel="noreferrer" onClick={close} className="mt-4 block bg-primary px-4 py-3 text-center font-mono text-sm font-bold uppercase text-primary-foreground">{ann.button_label}</a>
          ) : (
            <button onClick={async () => { await close(); navigate({ to: ann.button_link }); }} className="mt-4 w-full bg-primary px-4 py-3 font-mono text-sm font-bold uppercase text-primary-foreground">{ann.button_label}</button>
          )}
          <label className="mt-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <input type="checkbox" checked={never} onChange={(e) => setNever(e.target.checked)} /> Não mostrar de novo
          </label>
        </div>
      </div>
    </div>
  );
}

export const TERMS: [string, string][] = [
  ["1. Sobre a plataforma", "O chromaX é um mercado entre pessoas para itens digitais: sistemas, plugins, templates, contas de jogos, gift cards e outros itens gamers digitais."],
  ["2. Itens permitidos", "Somente itens digitais que você tem direito de vender. Itens físicos não são aceitos."],
  ["3. Itens proibidos", "É proibido anunciar conteúdo adulto, ilegal, pirataria, contas ou cartões roubados, malware, dados pessoais de terceiros, armas, drogas, apostas ou qualquer item que viole leis ou regras das plataformas de origem."],
  ["4. Pagamentos", "Os pagamentos são processados pelo checkout seguro da plataforma. Nunca pague ou receba fora da plataforma."],
  ["5. Entrega", "Após a confirmação do pagamento o item é entregue automaticamente na sua área e no chat da compra, ou pelo vendedor no chat quando a venda for manual."],
  ["6. Negociação", "Vendedores e compradores podem combinar preço pelo chat quando o anúncio permitir. O preço combinado é o que vale no checkout."],
  ["7. Conduta", "Respeite os outros usuários no feed e no chat. Golpes, spam e ofensas levam à suspensão da conta."],
  ["8. Responsabilidade", "O vendedor é responsável pela veracidade e funcionamento do item anunciado. Denúncias podem levar à remoção do anúncio."],
  ["9. Conta", "Você é responsável pela segurança da sua conta. Uma conta por pessoa."],
  ["10. Alterações", "Estes termos podem mudar. Avisaremos pelas novidades da plataforma."],
];

export function TermsLink() {
  return <Link to="/" className="underline">termos</Link>;
}
