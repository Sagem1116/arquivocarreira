import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Plus,
  Upload,
  X,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  Star,
  StarOff,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useArchive } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { readFilesAsBase64 } from "@/components/ImageUpload";
import { Lightbox } from "@/components/Lightbox";
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
import { toast } from "sonner";
import type { Mention } from "@/lib/types";

export const Route = createFileRoute("/mentions")({
  component: Mentions,
  head: () => ({ meta: [{ title: "Menções Honrosas — FM Career Archive" }] }),
});

function Mentions() {
  const mentions = useArchive((s) => s.data.mentions);
  const favorites = useArchive((s) => s.data.favorites);
  const add = useArchive((s) => s.addMention);
  const update = useArchive((s) => s.updateMention);
  const del = useArchive((s) => s.deleteMention);
  const toggleFavorite = useArchive((s) => s.toggleFavorite);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mention | null>(null);
  const [lb, setLb] = useState<{ images: string[]; index: number } | null>(null);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "title">("date");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tagFilter, setTagFilter] = useState("all");

  const allTags = useMemo(
    () => Array.from(new Set(mentions.flatMap((m) => m.tags || []))).sort(),
    [mentions],
  );

  const favoriteCount = useMemo(
    () => mentions.filter((m) => favorites.includes(m.id)).length,
    [favorites, mentions],
  );

  const filtered = useMemo(
    () => mentions.filter((m) => {
      if (tagFilter !== "all" && !(m.tags || []).includes(tagFilter)) return false;
      if (q) {
        const terms = [m.title, m.description, m.date, ...(m.tags || [])].join(" ").toLowerCase();
        if (!terms.includes(q.toLowerCase())) return false;
      }
      return true;
    }),
    [mentions, q, tagFilter],
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    return list.sort((a, b) => {
      if (sortKey === "title") {
        return sortDirection === "desc"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
      if (sortDirection === "desc") return (b.date || "").localeCompare(a.date || "");
      return (a.date || "").localeCompare(b.date || "");
    });
  }, [filtered, sortDirection, sortKey]);

  const mentionImageCount = useMemo(
    () => mentions.reduce((sum, m) => sum + m.images.length, 0),
    [mentions],
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Menções Honrosas"
        subtitle="Feitos, recordes e momentos lendários"
        icon={<Sparkles className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Adicionar</Button></DialogTrigger>
            <MentionDialog
              mention={editing}
              onSave={(d) => {
                if (editing) update(editing.id, d); else add(d);
                toast.success("Guardado");
                setOpen(false);
                setEditing(null);
              }}
              onDelete={editing ? () => {
                if (confirm("Apagar?")) {
                  del(editing.id);
                  setOpen(false);
                  setEditing(null);
                }
              } : undefined}
              onDuplicate={editing ? () => {
                add({
                  title: editing.title,
                  description: editing.description,
                  date: editing.date,
                  images: editing.images,
                  tags: editing.tags,
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
        <StatCard label="Menções" value={mentions.length} icon={Sparkles} accent />
        <StatCard label="Imagens" value={mentionImageCount} icon={Upload} />
        <StatCard label="Favoritos" value={favoriteCount} icon={Star} />
        <StatCard label="Tags" value={allTags.length} icon={Tag} />
      </div>

      <div className="card-elevated rounded-2xl p-4 mb-6 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_minmax(220px,280px)_minmax(220px,280px)] lg:grid-cols-[1.2fr_1fr_1fr] items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar título, descrição, tags…" value={q} onChange={(e) => setQ(e.target.value)} />
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

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full"><Tag className="h-3 w-3 mr-1" /><SelectValue placeholder="Filtrar por tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tags</SelectItem>
            {allTags.map((tag) => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-full"><ArrowUpDown className="h-3 w-3 mr-1" /><SelectValue placeholder="Ordenar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="title">Título</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortDirection} onValueChange={setSortDirection}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Direção" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recentes</SelectItem>
              <SelectItem value="asc">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Exibindo</p>
            <p className="text-sm text-muted-foreground">{filtered.length} de {mentions.length}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewMode((mode) => (mode === "grid" ? "list" : "grid"))}>
            {viewMode === "grid" ? <List className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
            {viewMode === "grid" ? "Ver lista" : "Ver grade"}
          </Button>
        </div>
      </div>

      {mentions.length === 0 ? (
        <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Sem menções"
          description="Regista invencibilidades, recuperações épicas, jovens revelações…"
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova</Button>} />
      ) : viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 gap-5">
          {sorted.map((m, i) => {
            const favorite = favorites.includes(m.id);
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => { setEditing(m); setOpen(true); }}
                className="group card-elevated rounded-2xl overflow-hidden border border-transparent hover:border-primary/60 transition"
              >
                {m.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {m.images.slice(0, 3).map((src, idx) => (
                      <div key={idx} className="aspect-video rounded-md overflow-hidden cursor-zoom-in"
                        onClick={(event) => { event.stopPropagation(); setLb({ images: m.images, index: idx }); }}>
                        <img src={src} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-44 rounded-b-none rounded-t-3xl bg-primary/5 grid place-items-center text-primary">
                    <Sparkles className="h-10 w-10" />
                  </div>
                )}
                <div className="p-5 relative">
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); toggleFavorite(m.id); }}
                    className="absolute right-4 top-4 rounded-full border border-border bg-background/90 p-2 text-muted-foreground shadow-sm hover:text-amber-500"
                    aria-label="Marcar favorito"
                  >
                    {favorite ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                  </button>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg">{m.title}</h3>
                      {m.date && <div className="text-xs text-muted-foreground mt-1">{m.date}</div>}
                    </div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); setEditing(m); setOpen(true); }}
                      className="text-xs text-primary hover:underline">Editar</button>
                  </div>
                  {m.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                  ) : null}
                  {m.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3 whitespace-pre-wrap">{m.description}</p>}
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((m, i) => {
            const favorite = favorites.includes(m.id);
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => { setEditing(m); setOpen(true); }}
                className="card-elevated rounded-3xl p-5 text-left border border-transparent hover:border-primary/50 transition"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{m.date || "Sem data"}</div>
                    <div className="font-semibold text-xl mt-2">{m.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); toggleFavorite(m.id); }}
                      className="rounded-full border border-border bg-background/90 p-2 text-muted-foreground hover:text-amber-500"
                      aria-label="Marcar favorito"
                    >
                      {favorite ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                    </button>
                    <Badge variant="outline">{m.tags?.length ? m.tags.join(" • ") : "Sem tags"}</Badge>
                  </div>
                </div>
                {m.description && <p className="text-sm text-muted-foreground mt-4 whitespace-pre-wrap">{m.description}</p>}
              </motion.button>
            );
          })}
        </div>
      )}

      {lb && <Lightbox images={lb.images} index={lb.index} onClose={() => setLb(null)} onIndex={() => {}} />}
    </div>
  );
}

function MentionDialog({
  mention,
  onSave,
  onDelete,
  onDuplicate,
}: {
  mention: Mention | null;
  onSave: (m: Omit<Mention, "id">) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  const [form, setForm] = useState<Omit<Mention, "id">>(mention || { title: "", images: [], tags: [] });

  useEffect(() => {
    setForm(mention || { title: "", images: [], tags: [] });
  }, [mention]);

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
      <DialogHeader><DialogTitle>{mention ? "Editar menção" : "Nova menção"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Título"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Invencibilidade · Liga 2025/26" /></Field>
        <Field label="Data"><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Descrição">
          <Textarea rows={4} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Tags (separadas por vírgula)">
          <Input value={(form.tags || []).join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
        </Field>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Imagens</Label>
          <label className="block">
            <input type="file" multiple accept="image/*" className="hidden"
              onChange={async (e) => {
                const imgs = await readFilesAsBase64(e.target.files);
                setForm({ ...form, images: [...form.images, ...imgs] });
              }} />
            <div className="rounded-xl border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/60">
              <Upload className="h-5 w-5 mx-auto mb-1" /> Carregar imagens
            </div>
          </label>
          {form.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {form.images.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-md overflow-hidden">
                  <img src={src} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1 hover:bg-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
  icon: typeof Sparkles;
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
