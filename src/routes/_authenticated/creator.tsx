import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Boxes, Check, ChevronRight, Crown, File, FileArchive, FileCode2, FileText, Folder, FolderPlus, Gamepad2, GraduationCap, HardDrive, ImagePlus, Package, Plus, Search, Star, Trash2, TrendingUp, Upload, Users, X, Code2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/creator")({
  head: () => ({ meta: [{ title: "Creator Studio — chromaX" }, { name: "description", content: "Seu hub de criação, projetos e ativos digitais no chromaX." }] }),
  component: Creator,
});

const CATS = ["SaaS", "Plugin", "Template", "Software", "API / Integração", "Automação", "Código", "Asset digital"];
const GAMER_CATS = ["Skin", "Conta", "Gift card", "Moeda / crédito", "Item / equipamento", "Passe de batalha", "Serviço dentro do jogo", "Outro"];
const prettySize = (n: number) => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(1) + " MB";
const cleanName = (s: string) => s.trim().replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").slice(0, 64);
type FolderItem = { id: string; name: string; parentId: string | null; createdAt: string };
type AssetItem = { id: string; name: string; path: string; folderId: string | null; size: number; mime: string; createdAt: string };
type Project = { id: string; name: string; createdAt: string; folders: FolderItem[]; files: AssetItem[] };
type CreatorKind = "dev" | "gamer" | "mentoria";

function Creator() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const storage = supabase.storage.from("media");
  const manifestPath = user.id + "/creator-workspace";
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<"workspace" | "publish" | "subscribers" | "mentoria" | "gamer" | "offers">("workspace");
  const [creatorTypes, setCreatorTypes] = useState<CreatorKind[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [game, setGame] = useState("");
  const [offering, setOffering] = useState("");
  const [setupSaving, setSetupSaving] = useState(false);
  const [modal, setModal] = useState<"project" | "folder" | null>(null);
  const [modalName, setModalName] = useState("");
  const [search, setSearch] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [deliverFile, setDeliverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", category: "Plugin", price: "", description: "", deliverable_type: "text" as "text" | "file", content: "", sale_mode: "auto" as "auto" | "chat" });

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const breadcrumbs = useMemo(() => {
    if (!activeProject || !activeFolderId) return [];
    const chain: FolderItem[] = [];
    let current = activeProject.folders.find((folder) => folder.id === activeFolderId);
    while (current) {
      chain.unshift(current);
      current = current.parentId ? activeProject.folders.find((folder) => folder.id === current!.parentId) : undefined;
    }
    return chain;
  }, [activeProject, activeFolderId]);

  async function loadWorkspace() {
    setLoading(true);
    try {
      const { data: manifests, error: listError } = await storage.list(manifestPath, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (listError) throw listError;
      const latest = (manifests ?? []).filter((item) => item.name.endsWith(".json")).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0];
      if (!latest) { setProjects([]); return; }
      const { data, error } = await storage.download(manifestPath + "/" + latest.name);
      if (error) throw error;
      const parsed = JSON.parse(await data.text()) as { projects?: Project[] };
      setProjects(Array.isArray(parsed.projects) ? parsed.projects : []);
    } catch (error) { toast.error("Não foi possível carregar seus projetos", { description: (error as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadWorkspace(); }, [user.id]);
  useEffect(() => {
    let alive = true;
    supabase.from("creator_profiles").select("creator_type,creator_types,game,offering").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (!alive) return;
      if (error) toast.error("Não foi possível carregar seu perfil Creator", { description: error.message });
      if (data) { const selected = (data.creator_types?.length ? data.creator_types : [data.creator_type]).filter((value): value is CreatorKind => ["dev", "gamer", "mentoria"].includes(value)); setCreatorTypes(selected); setGame(data.game ?? ""); setOffering(data.offering ?? ""); if (selected.includes("gamer")) setF((current) => ({ ...current, category: GAMER_CATS.includes(current.category) ? current.category : GAMER_CATS[0] })); }
      else setSetupOpen(true);
      setSetupLoading(false);
    });
    return () => { alive = false; };
  }, [user.id]);
  async function saveCreatorSetup() {
    if (!creatorTypes.length) { toast.error("Selecione pelo menos uma área."); return; }
    if (creatorTypes.includes("gamer") && !game.trim()) { toast.error("Informe qual jogo você oferece."); return; }
    if ((creatorTypes.includes("gamer") || creatorTypes.includes("mentoria")) && !offering.trim()) { toast.error("Descreva o que você vai oferecer."); return; }
    setSetupSaving(true);
    const { error } = await supabase.from("creator_profiles").upsert({
      user_id: user.id,
      creator_type: creatorTypes[0],
      creator_types: creatorTypes,
      game: creatorTypes.includes("gamer") ? game.trim() : null,
      offering: creatorTypes.some((type) => type === "gamer" || type === "mentoria") ? offering.trim() : null,
    }, { onConflict: "user_id" });
    setSetupSaving(false);
    if (error) { toast.error("Não foi possível salvar sua escolha", { description: error.message }); return; }
    setSetupOpen(false);
    if (creatorTypes.includes("gamer")) setF((current) => ({ ...current, category: GAMER_CATS.includes(current.category) ? current.category : GAMER_CATS[0] }));\n    setSection(creatorTypes.includes("dev") ? "workspace" : creatorTypes.includes("gamer") ? "gamer" : "mentoria");
    toast.success("Creator configurado");
  }
  const { data: creatorProducts = [] } = useQuery({ queryKey: ["creator-products", user.id], enabled: creatorTypes.includes("gamer"), queryFn: async () => { const { data, error } = await supabase.from("products").select("id,slug,name,category,price_cents,images,created_at").eq("creator_id", user.id).order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } });
  const { data: subscriberRows = [] } = useQuery({ queryKey: ["creator-subscribers", user.id], queryFn: async () => {
    const { data, error } = await supabase.from("creator_subscriptions").select("id,subscriber_id,created_at,profiles!creator_subscriptions_subscriber_id_fkey(display_name,username,logo_url)").eq("creator_id", user.id).eq("status", "active").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  } });

  async function persist(next: Project[]) {
    const snapshot = manifestPath + "/index-" + Date.now() + "-" + crypto.randomUUID() + ".json";
    const { error } = await storage.upload(snapshot, new Blob([JSON.stringify({ projects: next })], { type: "application/json" }), { upsert: false, contentType: "application/json", cacheControl: "0" });
    if (error) throw error;
    setProjects(next);
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const name = cleanName(modalName);
    if (!name) return;
    setSaving(true);
    try {
      const project: Project = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), folders: [], files: [] };
      await persist([project, ...projects]);
      setActiveProjectId(project.id); setActiveFolderId(null); setModal(null); setModalName("");
      toast.success("Projeto criado");
    } catch (error) { toast.error("Falha ao criar projeto", { description: (error as Error).message }); }
    finally { setSaving(false); }
  }

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProject) return;
    const name = cleanName(modalName);
    if (!name) return;
    const next = projects.map((p) => p.id !== activeProject.id ? p : ({ ...p, folders: [...p.folders, { id: crypto.randomUUID(), name, parentId: activeFolderId, createdAt: new Date().toISOString() }] }));
    setSaving(true);
    try { await persist(next); setModal(null); setModalName(""); toast.success("Pasta criada"); }
    catch (error) { toast.error("Falha ao criar pasta", { description: (error as Error).message }); }
    finally { setSaving(false); }
  }

  async function uploadProjectFiles(files: FileList | null) {
    if (!activeProject || !files?.length) return;
    setSaving(true);
    try {
      const added: AssetItem[] = [];
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^\p{L}\p{N}._-]/gu, "_");
        const path = user.id + "/creator-workspace/" + activeProject.id + "/" + (activeFolderId ?? "root") + "/" + crypto.randomUUID() + "-" + safe;
        const { error } = await storage.upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
        if (error) throw error;
        added.push({ id: crypto.randomUUID(), name: file.name, path, folderId: activeFolderId, size: file.size, mime: file.type, createdAt: new Date().toISOString() });
      }
      await persist(projects.map((p) => p.id !== activeProject.id ? p : ({ ...p, files: [...p.files, ...added] })));
      toast.success(added.length + " arquivo(s) adicionados");
    } catch (error) { toast.error("Falha ao enviar arquivos", { description: (error as Error).message }); }
    finally { setSaving(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function downloadAsset(asset: AssetItem) {
    const { data, error } = await storage.download(asset.path);
    if (error) { toast.error("Não foi possível baixar o arquivo", { description: error.message }); return; }
    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = asset.name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function deleteAsset(asset: AssetItem) {
    if (!activeProject || !confirm('Excluir "' + asset.name + '"?')) return;
    setSaving(true);
    try {
      const { error } = await storage.remove([asset.path]); if (error) throw error;
      await persist(projects.map((p) => p.id !== activeProject.id ? p : ({ ...p, files: p.files.filter((x) => x.id !== asset.id) })));
      toast.success("Arquivo removido");
    } catch (error) { toast.error("Não foi possível excluir", { description: (error as Error).message }); }
    finally { setSaving(false); }
  }

  async function deleteFolder(folder: FolderItem) {
    if (!activeProject || !confirm('Excluir a pasta "' + folder.name + '" e seu conteúdo?')) return;
    const ids = new Set([folder.id]); let changed = true;
    while (changed) { changed = false; activeProject.folders.forEach((x) => { if (x.parentId && ids.has(x.parentId) && !ids.has(x.id)) { ids.add(x.id); changed = true; } }); }
    const removed = activeProject.files.filter((x) => x.folderId && ids.has(x.folderId));
    setSaving(true);
    try {
      if (removed.length) { const { error } = await storage.remove(removed.map((x) => x.path)); if (error) throw error; }
      await persist(projects.map((p) => p.id !== activeProject.id ? p : ({ ...p, folders: p.folders.filter((x) => !ids.has(x.id)), files: p.files.filter((x) => !x.folderId || !ids.has(x.folderId)) })));
      setActiveFolderId(folder.parentId); toast.success("Pasta removida");
    } catch (error) { toast.error("Não foi possível excluir a pasta", { description: (error as Error).message }); }
    finally { setSaving(false); }
  }

  async function deleteProject(project: Project) {
    if (!confirm('Excluir o projeto "' + project.name + '" e todos os seus arquivos?')) return;
    setSaving(true);
    try {
      if (project.files.length) { const { error } = await storage.remove(project.files.map((x) => x.path)); if (error) throw error; }
      await persist(projects.filter((x) => x.id !== project.id));
      if (activeProjectId === project.id) { setActiveProjectId(null); setActiveFolderId(null); }
      toast.success("Projeto excluído");
    } catch (error) { toast.error("Não foi possível excluir o projeto", { description: (error as Error).message }); }
    finally { setSaving(false); }
  }

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(f.price.replace(",", ".")) * 100);
    if (!f.name.trim()) { toast.error("Dê um nome ao item"); return; }
    if (images.length < 3) { toast.error("Envie no mínimo 3 fotos de prévia"); return; }
    if (!cents || cents < 100) { toast.error("Preço mínimo R$ 1,00"); return; }
    if (f.deliverable_type === "text" && !f.content.trim()) { toast.error("Escreva o conteúdo que será entregue"); return; }
    if (f.deliverable_type === "file" && !deliverFile) { toast.error("Anexe o arquivo que será entregue"); return; }
    setBusy(true);
    try {
      const urls = await Promise.all(images.map((img) => uploadMedia(user.id, img)));
      const slug = f.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + crypto.randomUUID().slice(0, 6);
      const { data: prof } = await supabase.from("profiles").select("username,display_name").eq("id", user.id).maybeSingle();
      const { data: prod, error } = await supabase.from("products").insert({ slug, name: f.name.trim(), category: f.category, rarity: "Comum", price_cents: cents, description: f.description.trim(), creator_id: user.id, sale_mode: f.sale_mode, images: urls, deliverable_type: f.deliverable_type, seller_name: prof?.username || prof?.display_name || "creator" }).select("id").single();
      if (error) throw error;
      let file_path: string | null = null;
      if (deliverFile) { file_path = user.id + "/entregas/" + crypto.randomUUID() + "-" + deliverFile.name; const up = await storage.upload(file_path, deliverFile); if (up.error) throw up.error; }
      const d = await supabase.from("product_deliverables").insert({ product_id: prod.id, creator_id: user.id, content: f.deliverable_type === "text" ? f.content : null, file_path });
      if (d.error) throw d.error;
      toast.success("Item publicado!"); qc.invalidateQueries({ queryKey: ["products"] }); navigate({ to: "/produto/$slug", params: { slug } });
    } catch (err) { toast.error("Não foi possível publicar", { description: (err as Error).message }); }
    finally { setBusy(false); }
  }

  const input = "mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";
  const label = "block text-xs font-medium uppercase tracking-wider text-muted-foreground";
  const toggle = (on: boolean) => "flex-1 rounded-xl border px-3 py-3 text-left text-xs uppercase " + (on ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground");
  const foldersHere = activeProject?.folders.filter((x) => x.parentId === activeFolderId && x.name.toLowerCase().includes(search.toLowerCase())) ?? [];
  const filesHere = activeProject?.files.filter((x) => x.folderId === activeFolderId && x.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <main className="min-h-screen bg-black pb-[calc(6rem+env(safe-area-inset-bottom))] font-sans text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-3 py-3 sm:px-6 sm:py-6">
        {setupLoading ? <div className="py-20 text-center text-sm text-muted-foreground">Carregando Creator...</div> : <>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#181818] via-[#111111] to-[#090909] p-4 sm:rounded-3xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-white/5 blur-3xl"/>
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85"><Crown size={13} className="fill-violet-400/20"/> Creator Hub</div>
              <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight sm:text-2xl">{creatorTypes.length > 1 ? "Seu espaço de criação" : creatorTypes.includes("gamer") ? "Sua comunidade" : creatorTypes.includes("mentoria") ? "Sua área de mentoria" : "Seu espaço de criação"}</h1>
              <p className="mt-1 text-xs text-zinc-400">Crie, organize e compartilhe no ChromaX.</p>
            </div>
            <button onClick={() => setSetupOpen(true)} aria-label="Configurar Creator" className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-violet-300 transition hover:bg-white/10"><Crown size={18}/></button>
          </div>
          <div className="relative mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
            {[
              {label:"Projetos",value:String(projects.length),Icon:Boxes},
              {label:"Arquivos",value:String(projects.reduce((total, project) => total + project.files.length, 0)),Icon:HardDrive},
              {label:"Assinantes",value:String(subscriberRows.length),Icon:Users},
              {label:"Áreas",value:String(creatorTypes.length),Icon:TrendingUp},
            ].map(({label,value,Icon}) => <div key={label} className="min-w-0 rounded-xl border border-white/[0.07] bg-black/25 px-2 py-2.5 sm:px-3"><div className="flex items-center justify-center gap-1 text-zinc-400 sm:justify-between"><span className="truncate text-[9px] sm:text-[11px]">{label}</span><Icon size={13} className="shrink-0 text-white/75"/></div><p className="mt-1 text-center text-lg font-semibold leading-none tracking-tight text-white sm:text-xl">{value}</p></div>)}
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-start gap-1 overflow-x-auto border-t border-white/15 bg-black/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-12px_35px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:left-1/2 sm:right-auto sm:w-full sm:max-w-5xl sm:-translate-x-1/2 sm:rounded-t-2xl sm:border-x sm:border-white/15 sm:px-4">
          {creatorTypes.includes("dev") && <>
            <button onClick={() => { setSection("workspace"); setActiveProjectId(null); setActiveFolderId(null); }} aria-current={section === "workspace" ? "page" : undefined} className={"flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition sm:px-4 " + (section === "workspace" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white")}><HardDrive size={15}/>Workspace</button>
            <button onClick={() => setSection("publish")} aria-current={section === "publish" ? "page" : undefined} className={"flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition sm:px-4 " + (section === "publish" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white")}><Package size={15}/>Marketplace</button>
            <button onClick={() => setSection("subscribers")} aria-current={section === "subscribers" ? "page" : undefined} className={"flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition sm:px-4 " + (section === "subscribers" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white")}><Star size={15}/>Assinantes</button>
          </>}
          {creatorTypes.includes("gamer") && <>
            <button onClick={() => setSection("gamer")} aria-current={section === "gamer" ? "page" : undefined} className={"flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold " + (section === "gamer" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white")}><Gamepad2 size={15}/>Divulgar</button>
            <button onClick={() => setSection("offers")} aria-current={section === "offers" ? "page" : undefined} className={"flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold " + (section === "offers" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white")}><Package size={15}/>Minhas ofertas</button>
          </>}
          {creatorTypes.includes("mentoria") && <button onClick={() => setSection("mentoria")} aria-current={section === "mentoria" ? "page" : undefined} className={"flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold " + (section === "mentoria" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white")}><GraduationCap size={15}/>Mentoria</button>}
          <button onClick={() => setSetupOpen(true)} className="ml-auto flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs text-zinc-500 hover:bg-white/10 hover:text-white"><Crown size={14}/>Editar</button>
        </div>
        {activeProject && <div className="mt-2 truncate text-[11px] text-zinc-500">Projeto aberto: {activeProject.name}</div>}

        {creatorTypes.includes("dev") && section === "workspace" && (
          <div className="mt-4">
            {!activeProject ? <>
              <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Seus projetos</h2><p className="mt-1 text-xs text-muted-foreground">{projects.length} projeto(s) no workspace</p></div><button onClick={() => { setModal("project"); setModalName(""); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><Plus size={15}/>Novo projeto</button></div>
              {loading ? <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">Carregando workspace...</div> : projects.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => <article key={project.id} className="group rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/30"><button onClick={() => { setActiveProjectId(project.id); setActiveFolderId(null); setSearch(""); }} className="block w-full text-left"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-background"><Boxes size={22}/></span><ArrowUpRight size={17} className="text-muted-foreground"/></div><h3 className="mt-4 truncate font-semibold">{project.name}</h3><p className="mt-1 text-xs text-muted-foreground">{project.folders.length} pastas · {project.files.length} arquivos</p><p className="mt-3 text-[10px] text-muted-foreground">Criado em {new Date(project.createdAt).toLocaleDateString("pt-BR")}</p></button><button onClick={() => deleteProject(project)} disabled={saving} className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"><Trash2 size={12}/>Excluir projeto</button></article>)}
              </div> : <div className="rounded-3xl border border-dashed border-border bg-card/40 px-6 py-16 text-center"><Boxes size={30} className="mx-auto text-muted-foreground"/><h3 className="mt-4 text-lg font-semibold">Comece seu primeiro projeto</h3><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Crie um espaço para guardar códigos, documentos, imagens, versões e materiais do seu desenvolvimento.</p><button onClick={() => { setModal("project"); setModalName(""); }} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><Plus className="mr-2 inline" size={15}/>Criar projeto</button></div>}
            </> : <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5"><div className="min-w-0"><button onClick={() => { setActiveProjectId(null); setActiveFolderId(null); }} className="mb-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><ArrowLeft size={13}/>Todos os projetos</button><div className="flex flex-wrap items-center gap-1 text-sm"><button onClick={() => setActiveFolderId(null)} className={!activeFolderId ? "font-semibold" : "text-muted-foreground"}>{activeProject.name}</button>{breadcrumbs.map((folder) => <span key={folder.id} className="inline-flex items-center gap-1"><ChevronRight size={13}/><button onClick={() => setActiveFolderId(folder.id)} className={folder.id === activeFolderId ? "font-semibold" : "text-muted-foreground"}>{folder.name}</button></span>)}</div></div><div className="flex flex-wrap gap-2"><button onClick={() => { setModal("folder"); setModalName(""); }} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs"><FolderPlus size={15}/>Nova pasta</button><button onClick={() => fileInput.current?.click()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"><Upload size={15}/>Adicionar arquivos</button><input ref={fileInput} type="file" multiple hidden onChange={(e) => uploadProjectFiles(e.target.files)}/></div></div>
              <div className="flex items-center gap-2 border-b border-border px-4 py-3"><Search size={15} className="text-muted-foreground"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nesta pasta..." className="w-full bg-transparent text-sm outline-none"/><span className="whitespace-nowrap text-[10px] text-muted-foreground">{foldersHere.length + filesHere.length} itens</span></div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5 lg:grid-cols-4 xl:grid-cols-5">
                {foldersHere.map((folder) => <article key={folder.id} className="group relative min-w-0 rounded-xl border border-border bg-background p-3"><button onClick={() => setActiveFolderId(folder.id)} className="flex min-h-24 w-full flex-col items-start justify-center text-left"><Folder size={34} strokeWidth={1.35} className="fill-slate-400/15 text-slate-300"/><span className="mt-3 w-full truncate text-sm font-medium">{folder.name}</span><span className="mt-1 text-[10px] text-muted-foreground">{activeProject.folders.filter((x) => x.parentId === folder.id).length} pastas · {activeProject.files.filter((x) => x.folderId === folder.id).length} arquivos</span></button><button onClick={() => deleteFolder(folder)} aria-label={"Excluir pasta " + folder.name} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={13}/></button></article>)}
                {filesHere.map((asset) => { const Icon = asset.mime.startsWith("image/") ? ImagePlus : asset.mime.includes("zip") ? FileArchive : asset.mime.includes("text") || asset.name.endsWith(".md") ? FileText : /\.(ts|tsx|js|jsx|py|html|css|json)$/i.test(asset.name) ? FileCode2 : File; return <article key={asset.id} className="group relative min-w-0 rounded-xl border border-border bg-background p-3"><button onClick={() => downloadAsset(asset)} className="flex min-h-24 w-full flex-col items-start justify-center text-left"><Icon size={34} strokeWidth={1.35} className="text-muted-foreground"/><span className="mt-3 w-full truncate text-sm font-medium">{asset.name}</span><span className="mt-1 text-[10px] text-muted-foreground">{prettySize(asset.size)}</span></button><button onClick={() => deleteAsset(asset)} aria-label={"Excluir arquivo " + asset.name} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={13}/></button></article>; })}
                {!foldersHere.length && !filesHere.length && <div className="col-span-full py-14 text-center"><Folder size={30} className="mx-auto text-muted-foreground/60"/><p className="mt-3 text-sm font-medium">Esta pasta está vazia</p><p className="mt-1 text-xs text-muted-foreground">Crie uma pasta ou adicione arquivos para começar.</p></div>}
              </div>
              {saving && <div className="border-t border-border px-4 py-2 text-center text-[11px] text-muted-foreground">Sincronizando alterações...</div>}
            </div>}
          </div>
        )}

        {((creatorTypes.includes("dev") && section === "publish") || (creatorTypes.includes("gamer") && section === "gamer")) && <div className="mt-4 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
          <div className="h-fit rounded-3xl border border-border bg-card p-5"><p className="font-mono text-[10px] tracking-[.2em] text-muted-foreground">{creatorTypes.includes("gamer") ? "CHROMAX / GAMER" : "CHROMAX MARKETPLACE"}</p><h2 className="mt-3 text-xl font-bold">{creatorTypes.includes("gamer") ? "Divulgue seus itens e serviços" : "Leve seu projeto ao mercado."}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{creatorTypes.includes("gamer") ? "Anuncie skins, contas, gift cards, moedas e outros itens do jogo escolhido. Organize suas ofertas em um catálogo próprio." : "Publique plugins, templates, SaaS, ferramentas, códigos e outros ativos digitais. Seus arquivos privados do workspace continuam separados dos produtos anunciados."}</p>{creatorTypes.includes("gamer") && <div className="mt-4 rounded-xl bg-violet-500/10 px-3 py-3"><p className="text-[10px] uppercase tracking-wider text-violet-300">Seu jogo</p><p className="mt-1 text-sm font-semibold text-white">{game || "Jogo não definido"}</p></div>}<div className="mt-5 space-y-3 text-xs text-muted-foreground"><p><Check className="mr-2 inline" size={14}/>{creatorTypes.includes("gamer") ? "Categorias para cada tipo de oferta" : "Prévia com imagens"}</p><p><Check className="mr-2 inline" size={14}/>{creatorTypes.includes("gamer") ? "Fotos, preço e descrição" : "Entrega por texto ou arquivo"}</p><p><Check className="mr-2 inline" size={14}/>{creatorTypes.includes("gamer") ? "Catálogo de anúncios por jogo" : "Venda automática ou negociação por chat"}</p></div></div>
          <form onSubmit={submitProduct} className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-7"><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Novo anúncio</p><h3 className="mt-1 text-xl font-semibold">Detalhes do produto</h3></div>
            <div><p className={label}>Fotos de prévia (mín. 3) — {images.length}</p><div className="mt-2 grid grid-cols-3 gap-2">{images.map((img, i) => <div key={img.name + i} className="relative aspect-square overflow-hidden rounded-xl border border-border"><img src={URL.createObjectURL(img)} alt="" className="h-full w-full object-cover"/><button type="button" aria-label="Remover imagem" onClick={() => setImages(images.filter((_, k) => k !== i))} className="absolute right-1 top-1 rounded-full bg-background p-1"><X size={12}/></button></div>)}{images.length < 8 && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground"><ImagePlus size={20}/>Adicionar<input type="file" accept="image/*" multiple hidden onChange={(e) => setImages([...images, ...Array.from(e.target.files ?? [])].slice(0, 8))}/></label>}</div></div>
            <label className={label}>{creatorTypes.includes("gamer") ? "Nome do item / oferta" : "Nome"}<input className={input} maxLength={80} placeholder={creatorTypes.includes("gamer") ? "Ex.: Skin Vandal Prime" : "Nome do produto"} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}/></label><label className={label}>{creatorTypes.includes("gamer") ? "O que você está anunciando?" : "Categoria"}<select className={input} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{(creatorTypes.includes("gamer") ? GAMER_CATS : CATS).map((x) => <option key={x}>{x}</option>)}</select></label><label className={label}>Preço (R$)<input className={input} inputMode="decimal" placeholder="49,90" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/[^0-9.,]/g, "") })}/></label><label className={label}>Descrição<textarea className={input} rows={4} maxLength={1000} placeholder={creatorTypes.includes("gamer") ? "Detalhes, plataforma, região, nível, quantidade ou condições..." : "Descreva seu produto..."} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}/></label>
            <div><p className={label}>O que será entregue</p><div className="mt-2 flex gap-2"><button type="button" className={toggle(f.deliverable_type === "text")} onClick={() => setF({ ...f, deliverable_type: "text" })}>Texto / código</button><button type="button" className={toggle(f.deliverable_type === "file")} onClick={() => setF({ ...f, deliverable_type: "file" })}>Arquivo</button></div>{f.deliverable_type === "text" ? <textarea className={input} rows={3} placeholder="Conteúdo que será entregue ao comprador..." value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })}/> : <input type="file" className={input} onChange={(e) => setDeliverFile(e.target.files?.[0] ?? null)}/>}<p className="mt-1 text-[10px] text-muted-foreground">O conteúdo fica privado e é entregue após a compra.</p></div>
            <div><p className={label}>Modelo de venda</p><div className="mt-2 flex gap-2"><button type="button" className={toggle(f.sale_mode === "auto")} onClick={() => setF({ ...f, sale_mode: "auto" })}>Automática · preço fixo</button><button type="button" className={toggle(f.sale_mode === "chat")} onClick={() => setF({ ...f, sale_mode: "chat" })}>Negociar pelo chat</button></div></div>
            <button disabled={busy} className="w-full rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Publicando..." : "Publicar no marketplace"} <ArrowUpRight className="ml-1 inline" size={16}/></button>
          </form>
        </div>}
        {creatorTypes.includes("gamer") && section === "offers" && <div className="mt-4">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Minhas ofertas</h2><p className="mt-1 text-xs text-muted-foreground">Anúncios publicados para {game || "seu jogo"}</p></div><button onClick={() => setSection("gamer")} className="min-h-10 rounded-xl bg-white px-3 text-xs font-semibold text-white"><Plus size={14} className="mr-1 inline"/>Novo anúncio</button></div>
          {creatorProducts.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{creatorProducts.map((product: any) => <article key={product.id} className="overflow-hidden rounded-xl bg-white/[.04]"><div className="aspect-square bg-black/30">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-zinc-600"><Gamepad2 size={28}/></div>}</div><div className="p-3"><p className="truncate text-sm font-semibold">{product.name}</p><p className="mt-1 text-[10px] text-violet-300">{product.category}</p><p className="mt-2 text-sm font-semibold">R$ {(product.price_cents / 100).toFixed(2).replace(".", ",")}</p></div></article>)}</div> : <div className="rounded-2xl bg-white/[.03] px-5 py-12 text-center"><Gamepad2 size={28} className="mx-auto text-violet-400"/><p className="mt-3 text-sm font-semibold">Seu catálogo começa aqui</p><p className="mt-1 text-xs text-zinc-500">Publique sua primeira skin, conta, gift card ou item de {game || "jogo"}.</p><button onClick={() => setSection("gamer")} className="mt-4 min-h-11 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white">Criar anúncio</button></div>}
        </div>}
        {creatorTypes.includes("mentoria") && section === "mentoria" && <div className="mt-4 rounded-2xl bg-white/[.03] p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><GraduationCap size={20}/></span><div><h2 className="text-lg font-semibold">Sua área de mentoria</h2><p className="text-xs text-zinc-500">Apresente seus conhecimentos e serviços</p></div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{offering || "Adicione uma descrição nas configurações de Creator para apresentar sua mentoria."}</p><button onClick={() => setSetupOpen(true)} className="mt-4 min-h-11 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white">Editar apresentação</button></div>}
        {creatorTypes.includes("dev") && section === "subscribers" && <div className="mt-4"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Assinantes</h2><span className="text-xs text-muted-foreground">{subscriberRows.length}</span></div>{subscriberRows.length ? <div className="divide-y divide-border">{subscriberRows.map((row: any) => { const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles; return <div key={row.id} className="flex items-center gap-3 py-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-card">{p?.logo_url ? <img src={p.logo_url} alt="" className="h-full w-full object-cover"/> : (p?.display_name || p?.username || "?").slice(0,1)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p?.display_name || p?.username || "Assinante"}</p><p className="text-[11px] text-muted-foreground">@{p?.username || "usuário"}</p></div><span className="text-[10px] text-emerald-400">Ativo</span></div>; })}</div> : <p className="py-14 text-center text-sm text-muted-foreground">Seus assinantes aparecerão aqui.</p>}</div>}
      </>}
      </section>

      {setupOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-background/80 p-3 py-[max(12px,env(safe-area-inset-top))] backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Configurar Creator">
        <section className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card text-foreground shadow-2xl">
          <div className="border-b border-border px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between"><p className="font-mono text-[10px] tracking-[.22em] text-muted-foreground">CHROMAX / CREATOR</p><button type="button" onClick={() => setSetupOpen(false)} aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"><X size={17}/></button></div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Como você quer usar o Creator?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Escolha uma ou mais áreas. Você pode combinar suas atividades.</p>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-7 sm:py-6">
            <div className="grid gap-2 sm:grid-cols-3">
              {([{id:"dev",label:"Desenvolvedor",desc:"Projetos e marketplace",Icon:Code2},{id:"gamer",label:"Gamer",desc:"Jogos e ofertas",Icon:Gamepad2},{id:"mentoria",label:"Mentoria",desc:"Ensinar e orientar",Icon:GraduationCap}] as const).map(({id,label,desc,Icon}) => {
                const selected = creatorTypes.includes(id);
                return <button key={id} type="button" aria-pressed={selected} onClick={() => setCreatorTypes((current) => selected ? current.filter((item) => item !== id) : [...current, id])} className={"relative flex min-h-28 flex-col items-start rounded-2xl border p-4 text-left transition " + (selected ? "border-foreground bg-foreground/[.06]" : "border-border bg-background hover:bg-secondary/50")}>
                  <span className={"grid h-9 w-9 place-items-center rounded-xl " + (selected ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}><Icon size={18}/></span>
                  <span className="mt-3 text-xs font-semibold">{label}</span><span className="mt-1 text-[10px] text-muted-foreground">{desc}</span>
                  {selected && <Check size={15} className="absolute right-3 top-3"/>}
                </button>;
              })}
            </div>
            {creatorTypes.includes("gamer") && <div><label className={label}>Qual jogo você trabalha?</label><input value={game} onChange={(e) => setGame(e.target.value)} placeholder="Ex.: Valorant, Fortnite, CS2" className={input}/></div>}
            {(creatorTypes.includes("gamer") || creatorTypes.includes("mentoria")) && <div><label className={label}>{creatorTypes.includes("gamer") && creatorTypes.includes("mentoria") ? "O que você oferece em jogos e mentorias?" : creatorTypes.includes("gamer") ? "O que você oferece para jogadores?" : "Qual mentoria você oferece?"}</label><textarea value={offering} onChange={(e) => setOffering(e.target.value)} rows={3} placeholder="Descreva serviços, aulas, coaching ou comunidade..." className={input + " resize-none"}/></div>}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><p className="text-[11px] text-muted-foreground">{creatorTypes.length} área(s) selecionada(s)</p><button type="button" onClick={saveCreatorSetup} disabled={setupSaving || !creatorTypes.length} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-40">{setupSaving ? "Salvando..." : "Salvar e continuar"} <ArrowUpRight className="ml-1 inline" size={15}/></button></div>
          </div>
        </section>
      </div>}
      {modal && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={() => setModal(null)}><form onSubmit={modal === "project" ? createProject : createFolder} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background">{modal === "project" ? <Boxes size={19}/> : <FolderPlus size={19}/>}</span><button type="button" onClick={() => setModal(null)} aria-label="Fechar" className="rounded-lg p-2 text-muted-foreground"><X size={17}/></button></div><h2 className="mt-4 text-lg font-semibold">{modal === "project" ? "Criar projeto" : "Criar pasta"}</h2><p className="mt-1 text-xs text-muted-foreground">{modal === "project" ? "Dê um nome ao novo espaço de trabalho." : "A pasta será criada dentro do local atual."}</p><input autoFocus value={modalName} onChange={(e) => setModalName(e.target.value)} maxLength={64} placeholder={modal === "project" ? "Ex.: Meu próximo SaaS" : "Nome da pasta"} className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"/><button disabled={saving || !modalName.trim()} className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Salvando..." : "Continuar"}</button></form></div>}
    </main>
  );
}
