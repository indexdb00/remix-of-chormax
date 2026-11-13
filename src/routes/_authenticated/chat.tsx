import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, ArrowLeft, Search, Info, MoreHorizontal } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const filteredChats = useMemo(() => visible.filter((chat) => {
    const otherId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
    const person = peopleQuery.data?.find((p) => p.id === otherId);
    const product = productsQuery.data?.find((p) => p.id === chat.product_id);
    const term = search.trim().toLowerCase();
    return !term || [person?.display_name, person?.username, product?.name].some((value) => value?.toLowerCase().includes(term));
  }), [visible, peopleQuery.data, productsQuery.data, search]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, active]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!selected || !text || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      chat_id: selected.id, sender_id: user.id, body: text, kind: "text",
    });
    if (error) {
      toast.error("Não foi possível enviar a mensagem", { description: error.message });
    } else {
      setBody("");
      const { error: updateError } = await supabase.from("chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (updateError) {
        toast.error("Mensagem enviada, mas a conversa não foi atualizada.");
      }
      await qc.invalidateQueries({ queryKey: ["chat-messages", selected.id] });
      await qc.invalidateQueries({ queryKey: ["chats", user.id] });
    }
    setSending(false);
  }

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-0 py-0 sm:px-4 sm:py-5">
        <div className="grid h-[calc(100dvh-150px)] min-h-[520px] overflow-hidden border-y border-white/10 bg-[#0d0d11] sm:h-[min(780px,calc(100dvh-170px))] sm:rounded-2xl sm:border md:grid-cols-[350px_1fr]">
          <aside className={`min-h-0 border-border md:border-r ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <h1 className="text-xl font-semibold tracking-tight">Mensagens</h1>
              <button type="button" aria-label="Mais opções" className="rounded-full p-2 text-white/65 hover:bg-white/10 hover:text-white"><MoreHorizontal size={21}/></button>
            </div>
            <div className="px-4 pb-3">
              <label className="flex items-center gap-2 rounded-xl bg-white/[.07] px-3 py-2.5 text-white/45">
                <Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar" aria-label="Pesquisar conversas" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"/>
              </label>
            </div>
            <div className="flex gap-6 border-b border-white/10 px-5">
              <button onClick={() => { setTab("friends"); setActive(null); }} className={`border-b-2 pb-3 text-xs font-semibold ${tab === "friends" ? "border-white text-white" : "border-transparent text-white/40"}`}>Principal</button>
              <button onClick={() => { setTab("market"); setActive(null); }} className={`border-b-2 pb-3 text-xs font-semibold ${tab === "market" ? "border-white text-white" : "border-transparent text-white/40"}`}>Compras e vendas</button>
            </div>
            <p className="px-5 pb-2 pt-4 text-[11px] font-semibold text-white/45">Mensagens</p>
            {chatsQuery.isLoading ? <p className="p-5 text-xs text-muted-foreground">Carregando conversas…</p> : chatsQuery.isError ? <div className="px-5 py-10 text-center"><p className="text-xs text-white/60">Não foi possível carregar suas conversas.</p><button type="button" onClick={() => chatsQuery.refetch()} className="mt-3 text-xs font-semibold text-white underline underline-offset-4">Tentar novamente</button></div> : filteredChats.length ? filteredChats.map((chat) => {
              const otherId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
              const person = people.find((p) => p.id === otherId);
              const product = products.find((p) => p.id === chat.product_id);
              const name = person?.display_name || person?.username || "Membro ChromaX";
              return <button key={chat.id} onClick={() => setActive(chat.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[.055] ${active === chat.id ? "bg-white/[.08]" : ""}`}>
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-white/15 to-white/[.03] text-sm font-semibold">{person?.logo_url ? <img src={person.logo_url} alt="" className="h-full w-full object-cover"/> : name.slice(0,1).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{name}</span><span className="mt-1 block truncate text-[11px] text-white/45">{product?.name || "Toque para conversar"}</span></span>
                <span className="text-[9px] text-white/30">{new Date(chat.last_message_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              </button>;
            }) : <div className="px-6 py-16 text-center"><MessageCircle className="mx-auto mb-3 text-muted-foreground" size={26}/><p className="text-sm font-medium">Nenhuma conversa ainda</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{tab === "market" ? "Quando alguém iniciar uma negociação de produto, ela aparecerá aqui." : "Suas conversas com conexões aparecerão aqui."}</p></div>}
          </aside>
          <div className={`min-h-0 flex-col ${selected ? "flex" : "hidden md:flex"}`}>
            {selected ? <>
              <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <button onClick={() => setActive(null)} className="rounded-full p-2 text-white/65 hover:bg-white/10 md:hidden" aria-label="Voltar"><ArrowLeft size={19}/></button>
                {(() => {
                  const person = people.find((p) => p.id === (selected.buyer_id === user.id ? selected.seller_id : selected.buyer_id));
                  const name = person?.display_name || person?.username || "Membro ChromaX";
                  return <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-sm">{person?.logo_url ? <img src={person.logo_url} alt="" className="h-full w-full object-cover"/> : name.slice(0,1).toUpperCase()}</span>;
                })()}
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{people.find((p) => p.id === (selected.buyer_id === user.id ? selected.seller_id : selected.buyer_id))?.display_name || people.find((p) => p.id === (selected.buyer_id === user.id ? selected.seller_id : selected.buyer_id))?.username || "Membro ChromaX"}</p><p className="text-[10px] text-white/40">{products.find((p) => p.id === selected.product_id)?.name || "Ativo(a) no ChromaX"}</p></div>
                <button type="button" aria-label="Informações da conversa" className="rounded-full p-2 text-white/65 hover:bg-white/10"><Info size={19}/></button>
              </header>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 sm:px-6">
                {messagesQuery.isLoading ? <p className="text-center text-xs text-white/40">Carregando mensagens…</p> : messagesQuery.isError ? <div className="m-auto text-center"><p className="text-xs text-white/55">Não foi possível carregar as mensagens.</p><button type="button" onClick={() => messagesQuery.refetch()} className="mt-3 text-xs font-semibold text-white underline underline-offset-4">Tentar novamente</button></div> : messages.length ? messages.map((message) => <div key={message.id} className={`flex max-w-[82%] flex-col rounded-[22px] px-4 py-2.5 text-sm shadow-sm ${message.sender_id === user.id ? "ml-auto rounded-br-md bg-gradient-to-br from-zinc-100 to-zinc-300 text-black" : "mr-auto rounded-bl-md border border-white/10 bg-[#202024] text-white"}`}><p className="whitespace-pre-wrap break-words leading-5">{message.body}</p><time className={`mt-1 text-[9px] ${message.sender_id === user.id ? "text-black/45" : "text-white/35"}`}>{new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>) : <div className="m-auto max-w-xs text-center"><MessageCircle size={30} className="mx-auto text-white/30"/><p className="mt-3 text-sm font-medium">Envie uma mensagem</p><p className="mt-1 text-xs text-white/40">Sua conversa começa aqui.</p></div>}
                <div ref={messagesEndRef}/>
              </div>
              <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 px-3 py-3 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-white to-zinc-400 text-black"><MessageCircle size={17}/></span>
                <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Mensagem..." aria-label="Mensagem" className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/35"/>
                <button disabled={!body.trim() || sending} aria-label="Enviar mensagem" className="rounded-full px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-35">Enviar</button>
              </form>
            </> : <div className="m-auto hidden max-w-sm px-8 text-center md:block"><MessageCircle size={42} className="mx-auto text-white/25"/><h2 className="mt-4 text-base font-semibold">Suas mensagens</h2><p className="mt-2 text-xs leading-6 text-white/40">Selecione uma conversa para enviar uma mensagem.</p></div>}
          </div>
        </div>
      </section>
    </main>
  );
}
