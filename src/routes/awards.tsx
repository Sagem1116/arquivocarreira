import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Medal,
  Plus,
  Search,
  Filter,
  X,
  ArrowUpDown,
  LayoutGrid,
  List,
  Star,
  StarOff,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { useArchive } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { ClubBadge } from "@/components/ClubBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Award } from "@/lib/types";

export const Route = createFileRoute("/awards")({
  component: Awards,
  head: () => ({ meta: [{ title: "Prémios — FM Career Archive" }] }),
});

const TYPE_LABELS: Record<Award["type"], string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
  nomination: "Nomeação",
  hof: "Hall of Fame",
  record: "Recorde",
};

function Awards() {
  const awards = useArchive((s) => s.data.awards);
  const clubs = useArchive((s) => s.data.clubs);
  const favorites = useArchive((s) => s.data.favorites);
  const add = useArchive((s) => s.addAward);
  const update = useArchive((s) => s.updateAward);
  const del = useArchive((s) => s.deleteAward);
  const toggleFavorite = useArchive((s) => s.toggleFavorite);

  const [tab, setTab] = useState<"all" | Award["type"]>("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "type" | "title">("date");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Award | null>(null);

  const awardClubCount = useMemo(
    () => new Set(awards.filter((a) => a.clubId).map((a) => a.clubId)).size,
    [awards],
  );

  const favoriteCount = useMemo(
    () => awards.filter((a) => favorites.includes(a.id)).length,
    [awards, favorites],
  );

  const activeTypes = useMemo(
    () => new Set(awards.map((a) => a.type)).size,
    [awards],
  );

  const filtered = useMemo(
    () => awards.filter((a) => {
      if (tab !== "all" && a.type !== tab) return false;
      if (q) {
        const terms = [a.title, a.description, TYPE_LABELS[a.type], a.date].join(" ").toLowerCase();
        if (!terms.includes(q.toLowerCase())) return false;
      }
      return true;
    }),
    [awards, q, tab],
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    return list.sort((a, b) => {
      if (sortKey === "title") {
        return sortDirection === "desc"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
      if (sortKey === "type") {
        return sortDirection === "desc"
          ? TYPE_LABELS[b.type].localeCompare(TYPE_LABELS[a.type])
          : TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type]);
      }
      if (sortDirection === "desc") return (b.date || "").localeCompare(a.date || "");
      return (a.date || "").localeCompare(b.date || "");
    });
  }, [filtered, sortDirection, sortKey]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Prémios de Treinador"
        subtitle={`${awards.length} prémios e nomeações`}
        icon={<Medal className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </DialogTrigger>
            <AwardDialog
              award={editing}
              clubs={clubs}
              onSave={(data) => {
                if (editing) update(editing.id, data);
                else add(data);
                toast.success("Guardado");
                setOpen(false); setEditing(null);
              }}
              onDelete={editing ? () => {
                if (confirm("Apagar prémio?")) {
                  del(editing.id);
                  setOpen(false);
                  setEditing(null);
                }
              } : undefined}
              onDuplicate={editing ? () => {
                add({
                  title: editing.title,
                  type: editing.type,
                  date: editing.date,
                  clubId: editing.clubId,
                  description: editing.description,
                  image: editing.image,
                });
                toast.success("Duplicado");
                setOpen(false);
                setEditing(null);
              } : undefined}
            />
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Prémios" value={awards.length} icon={Medal} accent />
        <StatCard label="Clubes" value={awardClubCount} icon={Sparkles} />
        <StatCard label="Tipos" value={activeTypes} icon={CalendarDays} />
        <StatCard label="Favoritos" value={favoriteCount} icon={Star} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">Todos <span className="ml-1.5 text-[10px] opacity-60">{awards.length}</span></TabsTrigger>
          <TabsTrigger value="weekly">Semanais <span className="ml-1.5 text-[10px] opacity-60">{awards.filter((a) => a.type === "weekly").length}</span></TabsTrigger>
          <TabsTrigger value="monthly">Mensais <span className="ml-1.5 text-[10px] opacity-60">{awards.filter((a) => a.type === "monthly").length}</span></TabsTrigger>
          <TabsTrigger value="yearly">Anuais <span className="ml-1.5 text-[10px] opacity-60">{awards.filter((a) => a.type === "yearly").length}</span></TabsTrigger>
          <TabsTrigger value="hof">Hall of Fame <span className="ml-1.5 text-[10px] opacity-60">{awards.filter((a) => a.type === "hof").length}</span></TabsTrigger>
          <TabsTrigger value="record">Recordes <span className="ml-1.5 text-[10px] opacity-60">{awards.filter((a) => a.type === "record").length}</span></TabsTrigger>
          <TabsTrigger value="nomination" className="opacity-70">Nomeações <span className="ml-1.5 text-[10px] opacity-60">{awards.filter((a) => a.type === "nomination").length}</span></TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="card-elevated rounded-2xl p-4 mb-6 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_minmax(220px,280px)_minmax(220px,280px)] lg:grid-cols-[1.2fr_1fr_1fr] items-center">

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar título, tipo, data…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted/20"
              aria-label="Limpar pesquisa"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
          <SelectTrigger className="w-full"><ArrowUpDown className="h-3 w-3 mr-1" /><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Data</SelectItem>
            <SelectItem value="type">Tipo</SelectItem>
            <SelectItem value="title">Título</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortDirection} onValueChange={(v) => setSortDirection(v as any)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Direção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Mais recentes</SelectItem>
            <SelectItem value="asc">Mais antigos</SelectItem>
          </SelectContent>
        </Select>

        <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Exibindo</p>
            <p className="text-sm text-muted-foreground">{filtered.length} de {awards.length}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewMode((mode) => (mode === "grid" ? "list" : "grid"))}>
            {viewMode === "grid" ? <List className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
            {viewMode === "grid" ? "Ver lista" : "Ver grade"}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Medal className="h-6 w-6" />} title="Sem prémios"
          description="Adiciona o teu primeiro prémio ou nomeação."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo</Button>} />
      ) : viewMode === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((a, i) => {
            const c = clubs.find((x) => x.id === a.clubId);
            const favorite = favorites.includes(a.id);
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => { setEditing(a); setOpen(true); }}
                className={`group relative card-elevated rounded-3xl p-5 text-left overflow-hidden border border-transparent transition hover:border-primary/50 hover:-translate-y-0.5 ${a.type === "nomination" ? "opacity-70 saturate-75" : ""}`}
              >

                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); toggleFavorite(a.id); }}
                  className="absolute right-4 top-4 rounded-full border border-border bg-background/90 p-2 text-muted-foreground shadow-sm hover:text-amber-500"
                  aria-label="Marcar favorito"
                >
                  {favorite ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                </button>
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 grid place-items-center overflow-hidden shrink-0">
                    {a.image ? <img src={a.image} alt={a.title} className="h-full w-full object-cover" /> : <Medal className="h-8 w-8 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className="mb-2" variant="outline">{TYPE_LABELS[a.type]}</Badge>
                    <div className="font-semibold text-lg leading-tight line-clamp-2">{a.title}</div>
                    {a.date && <div className="text-xs text-muted-foreground mt-1">{a.date}</div>}
                    {c && <div className="mt-2"><ClubBadge club={c} size="sm" /></div>}
                    {a.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{a.description}</p>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((a, i) => {
            const c = clubs.find((x) => x.id === a.clubId);
            const favorite = favorites.includes(a.id);
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => { setEditing(a); setOpen(true); }}
                className={`card-elevated rounded-3xl p-5 text-left border border-transparent hover:border-primary/50 transition ${a.type === "nomination" ? "opacity-70 saturate-75" : ""}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{TYPE_LABELS[a.type]}</div>
                    <div className="font-semibold text-xl mt-2">{a.title}</div>
                    {a.date && <div className="text-sm text-muted-foreground mt-1">{a.date}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); toggleFavorite(a.id); }}
                      className="rounded-full border border-border bg-background/90 p-2 text-muted-foreground hover:text-amber-500"
                      aria-label="Marcar favorito"
                    >
                      {favorite ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                    </button>
                    {c ? <ClubBadge club={c} size="sm" /> : <Badge variant="outline">Sem clube</Badge>}
                  </div>
                </div>
                {a.description && <p className="text-sm text-muted-foreground mt-4">{a.description}</p>}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AwardDialog({
  award,
  clubs,
  onSave,
  onDelete,
  onDuplicate,
}: {
  award: Award | null;
  clubs: import("@/lib/types").Club[];
  onSave: (a: Omit<Award, "id">) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  const [form, setForm] = useState<Omit<Award, "id">>(award || {
    title: "",
    type: "monthly",
    date: "",
    clubId: undefined,
    description: "",
    image: "",
  });

  useEffect(() => {
    setForm(award || {
      title: "",
      type: "monthly",
      date: "",
      clubId: undefined,
      description: "",
      image: "",
    });
  }, [award]);

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
      <DialogHeader><DialogTitle>{award ? "Editar prémio" : "Novo prémio"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <ImageUpload value={form.image} onChange={(v) => setForm({ ...form, image: v })} aspect="square" label="Imagem" />
        <Field label="Título"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data"><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        </div>
        <Field label="Clube (opcional)">
          <Select value={form.clubId || ""} onValueChange={(v) => setForm({ ...form, clubId: v || undefined })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Descrição">
          <Textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-wrap gap-2">
            {onDelete ? <Button variant="destructive" onClick={onDelete}>Apagar</Button> : null}
            {onDuplicate ? <Button variant="outline" onClick={onDuplicate}>Duplicar</Button> : null}
          </div>
          <Button onClick={() => {
            if (!form.title) return toast.error("Título obrigatório");
            onSave(form);
          }}>Guardar</Button>
        </div>
      </div>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>{children}</div>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Medal;
  accent?: boolean;
}) {
  return (
    <div className={`card-elevated rounded-3xl p-4 ${accent ? "border border-primary/20" : "border border-border"}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold">{value}</div>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
