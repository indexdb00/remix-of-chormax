import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ArrowDownLeft, ArrowUpRight, Boxes, CreditCard, ExternalLink, LayoutDashboard, Package, Plus, Settings2, ShieldCheck, ShoppingBag, Wallet } from "lucide-react";

type Profile = { display_name: string | null; username: string | null; total_sold_cents: number; total_bought_cents: number; logo_url: string | null };
type Product = { id: string; slug: string; name: string; category: string; price_cents: number; images: string[]; sales: number; created_at: string };

const money = (value: number) => (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const sections = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "products", label: "Produtos", icon: Package },
  { id: "payments", label: "Cobranças", icon: CreditCard },
  { id: "wallet", label: "Carteira", icon: Wallet },
] as const;
type Section = typeof sections[number]["id"];

export function PaymentDashboard({ user }: { user: User }) {
  const [section, setSection] = useState<Section>("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const [profileResult, productsResult] = await Promise.all([
        supabase.from("profiles").select("display_name,username,total_sold_cents,total_bought_cents,logo_url").eq("id", user.id).maybeSingle(),
        supabase.from("products").select("id,slug,name,category,price_cents,images,sales,created_at").eq("creator_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setProfile(profileResult.data as Profile | null);
      setProducts((productsResult.data ?? []) as Product[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [user.id]);

  const displayName = profile?.display_name || profile?.username || user.email?.split("@")[0] || "Sua conta";
  const soldCount = products.reduce((sum, product) => sum + (product.sales || 0), 0);

  return (
    <main className="min-h-screen bg-[#090909] pb-28 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090909]/90 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight">chroma<span className="text-white/45">X</span></Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/45 sm:block">{user.email}</span>
            <Link to="/configuracoes" aria-label="Configurações" className="grid h-9 w-9 place-items-center rounded-full bg-white/[.06] text-white/70 hover:bg-white/10"><Settings2 size={17}/></Link>
            <Link to="/perfil" aria-label="Meu perfil" className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white text-black">{profile?.logo_url ? <img src={profile.logo_url} alt="" className="h-full w-full object-cover"/> : <span className="text-xs font-bold">{displayName.slice(0,1).toUpperCase()}</span>}</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/40">Área do vendedor · ChromaX Pay</p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Olá, {displayName}.</h1>
            <p className="mt-2 text-sm text-white/50">Gerencie seus produtos digitais e acompanhe sua operação.</p>
          </div>
          <Link to="/creator" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black transition hover:bg-white/85"><Plus size={16}/> Adicionar produto</Link>
        </div>

        <nav aria-label="Seções financeiras" className="mt-8 flex gap-1 overflow-x-auto border-b border-white/10">
          {sections.map(({id,label,icon:Icon}) => <button key={id} onClick={() => setSection(id)} className={"flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs transition " + (section===id ? "border-white text-white" : "border-transparent text-white/45 hover:text-white/80")}><Icon size={15}/>{label}</button>)}
        </nav>

        {section === "overview" && <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl bg-[#141414] p-5">
              <div className="flex items-center justify-between text-white/45"><span className="text-xs">Produtos cadastrados</span><Boxes size={17}/></div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">{loading ? "—" : products.length}</p>
              <p className="mt-1 text-[11px] text-white/35">No seu catálogo</p>
            </article>
            <article className="rounded-2xl bg-[#141414] p-5">
              <div className="flex items-center justify-between text-white/45"><span className="text-xs">Vendas registradas</span><Activity size={17}/></div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">{loading ? "—" : soldCount}</p>
              <p className="mt-1 text-[11px] text-white/35">Contagem informada pelos produtos</p>
            </article>
            <article className="rounded-2xl bg-[#141414] p-5">
              <div className="flex items-center justify-between text-white/45"><span className="text-xs">Total vendido no perfil</span><ArrowUpRight size={17}/></div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">{loading ? "—" : money(profile?.total_sold_cents ?? 0)}</p>
              <p className="mt-1 text-[11px] text-white/35">Registro do perfil, não saldo sacável</p>
            </article>
            <article className="rounded-2xl bg-[#141414] p-5">
              <div className="flex items-center justify-between text-white/45"><span className="text-xs">Total comprado no perfil</span><ArrowDownLeft size={17}/></div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">{loading ? "—" : money(profile?.total_bought_cents ?? 0)}</p>
              <p className="mt-1 text-[11px] text-white/35">Registro do perfil</p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
            <section className="rounded-2xl bg-[#141414] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Seus produtos</h2><p className="mt-1 text-xs text-white/40">Itens adicionados recentemente</p></div><button onClick={() => setSection("products")} className="text-xs text-white/55 hover:text-white">Ver todos</button></div>
              {loading ? <p className="py-10 text-center text-xs text-white/40">Carregando catálogo...</p> : products.length ? <div className="mt-4 divide-y divide-white/[.07]">{products.slice(0,4).map(product => <div key={product.id} className="flex items-center gap-3 py-3"><div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/[.06]">{product.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{product.name}</p><p className="mt-1 text-[10px] text-white/40">{product.category} · {product.sales ?? 0} vendas</p></div><span className="text-xs tabular-nums">{money(product.price_cents)}</span><Link to="/produto/$slug" params={{slug:product.slug}} aria-label={"Ver "+product.name} className="text-white/35 hover:text-white"><ExternalLink size={14}/></Link></div>)}</div> : <div className="py-10 text-center"><Package className="mx-auto text-white/30" size={24}/><p className="mt-3 text-xs text-white/50">Seu catálogo ainda está vazio.</p><Link to="/creator" className="mt-3 inline-flex text-xs underline underline-offset-4">Cadastrar primeiro produto</Link></div>}
            </section>
            <section className="rounded-2xl bg-[#141414] p-5 sm:p-6">
              <div className="flex items-center gap-2"><ShieldCheck size={17} className="text-white/65"/><h2 className="text-sm font-semibold">Recebimentos</h2></div>
              <p className="mt-3 text-sm leading-6 text-white/55">Configure os dados da operação para preparar a ativação dos pagamentos.</p>
              <div className="mt-5 rounded-xl bg-white/[.05] p-4"><p className="text-xs font-medium">Gateway ainda não conectado</p><p className="mt-1 text-[11px] leading-5 text-white/40">Não há processamento, saldo disponível ou saque ativo nesta versão.</p></div>
              <button onClick={() => setSection("wallet")} className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 text-xs text-white/75 hover:bg-white/[.05]">Ver configuração da carteira</button>
            </section>
          </div>
        </>}

        {section === "products" && <section className="mt-6 rounded-2xl bg-[#141414] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Catálogo de produtos</h2><p className="mt-1 text-xs text-white/40">SaaS, serviços e produtos digitais</p></div><Link to="/creator" className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black"><Plus size={14}/> Novo</Link></div>{loading ? <p className="py-10 text-center text-xs text-white/40">Carregando...</p> : products.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{products.map(product=><Link key={product.id} to="/produto/$slug" params={{slug:product.slug}} className="overflow-hidden rounded-xl bg-[#1c1c1c]"><div className="aspect-[16/9] bg-white/[.04]">{product.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover"/>}</div><div className="p-4"><p className="text-xs font-semibold">{product.name}</p><p className="mt-1 text-[10px] text-white/40">{product.category} · {product.sales ?? 0} vendas</p><p className="mt-3 text-sm font-semibold">{money(product.price_cents)}</p></div></Link>)}</div> : <p className="py-12 text-center text-xs text-white/45">Nenhum produto cadastrado.</p>}</section>}

        {section === "payments" && <section className="mt-6 rounded-2xl bg-[#141414] p-6 sm:p-8"><CreditCard size={25} className="text-white/55"/><h2 className="mt-4 text-lg font-semibold">Cobranças e transações</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Esta área ficará responsável por links de pagamento, pedidos, status de aprovação, reembolsos e histórico de transações.</p><div className="mt-6 rounded-xl bg-white/[.05] p-4"><p className="text-xs font-medium">Integração de pagamento pendente</p><p className="mt-1 text-xs leading-5 text-white/40">O projeto ainda não possui uma tabela de transações nem um provedor de pagamentos conectado. Nenhuma cobrança real pode ser criada ou consultada por enquanto.</p></div></section>}

        {section === "wallet" && <section className="mt-6 rounded-2xl bg-[#141414] p-6 sm:p-8"><Wallet size={25} className="text-white/55"/><h2 className="mt-4 text-lg font-semibold">Carteira e recebimentos</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Aqui ficarão saldo disponível, valores em análise, dados bancários, solicitações de saque e comprovantes.</p><div className="mt-6 rounded-xl bg-white/[.05] p-4"><p className="text-xs font-medium">Carteira não ativada</p><p className="mt-1 text-xs leading-5 text-white/40">Não exibimos saldo fictício. A carteira será habilitada após a integração com o gateway e a configuração dos recebimentos.</p></div></section>}
      </div>
      <nav aria-label="Navegação do painel" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#090909]/95 px-3 pb-[max(9px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto grid max-w-xl grid-cols-5 gap-1">{sections.map(({id,label,icon:Icon})=><button key={id} onClick={()=>setSection(id)} className={"flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] transition " +(section===id?"text-white":"text-white/40 hover:text-white/75")}><Icon size={18}/>{label}</button>)}<Link to="/perfil" className="flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] text-white/40 hover:text-white/75"><ShoppingBag size={18}/>Conta</Link></div></nav>
    </main>
  );
}
