import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, ArrowLeft, ShoppingBag, Users, Circle } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";

type ChatRow = { id: string; buyer_id: string; seller_id: string; product_id: string | null; last_message_at: string; };
type MessageRow = { id: string; chat_id: string; sender_id: string; body: string; kind: string; offer_cents: number | null; created_at: string; };

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat — chromaX" }, { name: "description", content: "Conversas e negociações no chromaX." }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"friends" | "market">("friends");
  const [sending, setSending] = useState(false);

  const chatsQuery = useQuery({
    queryKey: ["chats", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("chats").select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChatRow[];
    },
  });
  const chats = chatsQuery.data ?? [];
  const selected = chats.find((c) => c.id === active) ?? null;
  const visible = chats.filter((c) => tab === "market" ? !!c.product_id : !c.product_id);
  const otherIds = [...new Set(chats.map((c) => c.buyer_id === user.id ? c.seller_id : c.buyer_id))];
  const peopleQuery = useQuery({
    queryKey: ["chat-people", otherIds],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,display_name,username,logo_url").in("id", otherIds);
      if (error) throw error;
      return data ?? [];
    },
  });
  const productsQuery = useQuery({
    queryKey: ["chat-products", chats.map((c) => c.product_id)],
    enabled: chats.some((c) => !!c.product_id),
    queryFn: async () => {
      const ids = chats.flatMap((c) => c.product_id ? [c.product_id] : []);
      const { data, error } = await supabase.from("products").select("id,name,images").in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });
  const messagesQuery = useQuery({
    queryKey: ["chat-messages", active],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_messages").select("*").eq("chat_id", active!).order("created_at", { ascending: true }).limit(200);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  useEffect(() => {
    if (!active) return;
    const channel = supabase.channel(`chat-${active}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages", filter: `chat_id=eq.${active}` }, () => {
        qc.invalidateQueries({ queryKey: ["chat-messages", active] });
        qc.invalidateQueries({ queryKey: ["chats", user.id] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [active, qc, user.id]);

  useEffect(() => {
    const channel = supabase.channel(`chat-list-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, () => qc.invalidateQueries({ queryKey: ["chats", user.id] }))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc, user.id]);

  const people = peopleQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!selected || !text || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      chat_id: selected.id, sender_id: user.id, body: text, kind: "text",
    });
    if (error) toast.error("Não foi possível enviar a mensagem", { description: error.message });
    else {
      setBody("");
      await supabase.from("chats").update({ last_message_at: new Date().toISOString() }).eq("id", selected.id);
      qc.invalidateQueries({ queryKey: ["chat-messages", selected.id] });
      qc.invalidateQueries({ queryKey: ["chats", user.id] });
    }
    setSending(false);
  }

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-3 py-5 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <div><p className="text-[10px] uppercase tracking-[.24em] text-muted-foreground">Mensagens</p><h1 className="mt-1 font-display text-2xl font-extrabold">Chat</h1></div>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] text-muted-foreground">Tempo real</span>
        </div>
        <div className="grid min-h-[68vh] overflow-hidden rounded-2xl border border-border bg-card/70 md:grid-cols-[300px_1fr]">
          <aside className={`border-border md:border-r ${selected ? "hidden md:block" : "block"}`}>
            <div className="grid grid-cols-2 gap-1 border-b border-border p-2">
              <button onClick={() => { setTab("friends"); setActive(null); }} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs ${tab === "friends" ? "bg-white/10 text-foreground" : "text-muted-foreground"}`}><Users size={15}/> Amigos</button>
              <button onClick={() => { setTab("market"); setActive(null); }} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs ${tab === "market" ? "bg-white/10 text-foreground" : "text-muted-foreground"}`}><ShoppingBag size={15}/> Compras & vendas</button>
            </div>
            {chatsQuery.isLoading ? <p className="p-5 text-xs text-muted-foreground">Carregando conversas…</p> : visible.length ? visible.map((chat) => {
              const otherId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
              const person = people.find((p) => p.id === otherId);
              const product = products.find((p) => p.id === chat.product_id);
              const name = person?.display_name || person?.username || "Membro ChromaX";
              return <button key={chat.id} onClick={() => setActive(chat.id)} className={`flex w-full items-center gap-3 border-b border-border/70 p-4 text-left transition hover:bg-white/[.04] ${active === chat.id ? "bg-white/[.07]" : ""}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-sm font-semibold">{person?.logo_url ? <img src={person.logo_url} alt="" className="h-full w-full object-cover"/> : name.slice(0,1).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{name}</span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{product?.name || "Conversa pessoal"}</span></span>
                <Circle size={7} className="fill-white/50 text-white/50"/>
              </button>;
            }) : <div className="px-6 py-16 text-center"><MessageCircle className="mx-auto mb-3 text-muted-foreground" size={26}/><p className="text-sm font-medium">Nenhuma conversa ainda</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{tab === "market" ? "Quando alguém iniciar uma negociação de produto, ela aparecerá aqui." : "Suas conversas com conexões aparecerão aqui."}</p></div>}
          </aside>
          <div className={`flex min-h-[68vh] flex-col ${selected ? "flex" : "hidden md:flex"}`}>
            {selected ? <>
              <header className="flex items-center gap-3 border-b border-border p-4">
                <button onClick={() => setActive(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 md:hidden" aria-label="Voltar"><ArrowLeft size={18}/></button>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{people.find((p) => p.id === (selected.buyer_id === user.id ? selected.seller_id : selected.buyer_id))?.display_name || "Conversa ChromaX"}</p><p className="text-[10px] text-muted-foreground">{products.find((p) => p.id === selected.product_id)?.name || "Mensagem direta"}</p></div>
              </header>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {messagesQuery.isLoading ? <p className="text-center text-xs text-muted-foreground">Carregando mensagens…</p> : messages.length ? messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender_id === user.id ? "ml-auto rounded-br-sm bg-gradient-to-br from-zinc-100 to-zinc-400 text-black" : "mr-auto rounded-bl-sm border border-white/10 bg-white/[.06] text-foreground"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><time className="mt-1 block text-right text-[9px] opacity-55">{new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>) : <p className="m-auto text-center text-xs text-muted-foreground">Comece a conversa com uma mensagem.</p>}
              </div>
              <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
                <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Escreva uma mensagem…" aria-label="Mensagem" className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-white/50"/>
                <button disabled={!body.trim() || sending} aria-label="Enviar mensagem" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-white to-zinc-400 text-black disabled:opacity-40"><Send size={17}/></button>
              </form>
            </> : <div className="m-auto hidden max-w-sm px-8 text-center md:block"><MessageCircle size={36} className="mx-auto text-zinc-400"/><h2 className="mt-4 text-sm font-semibold">Suas conversas, em um só lugar</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Selecione uma conversa para continuar. Negociações de produtos ficam separadas das mensagens pessoais.</p></div>}
          </div>
        </div>
      </section>
    </main>
  );
}
