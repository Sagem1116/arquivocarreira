import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Plus,
  Search,
  Filter,
  X,
  Star,
  StarOff,
  ArrowUpDown,
  LayoutGrid,
  List,
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
import { toast } from "sonner";
import type { Trophy as TrophyT } from "@/lib/types";

export const Route = createFileRoute("/trophies")({
  component: Trophies,
  head: () => ({ meta: [{ title: "Títulos — FM Career Archive" }] }),
});

function Trophies() {
  const trophies = useArchive((s) => s.data.trophies);
  const clubs = useArchive((s) => s.data.clubs);
  const favorites = useArchive((s) => s.data.favorites);
  const add = useArchive((s) => s.addTrophy);
  const update = useArchive((s) => s.updateTrophy);
  const del = useArchive((s) => s.deleteTrophy);
  const toggleFavorite = useArchive((s) => s.toggleFavorite);

  const [q, setQ] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"year" | "club" | "competition">("year");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<TrophyT | null>(null);
  const [open, setOpen] = useState(false);

  const years = useMemo(
    () => Array.from(new Set(trophies.map((t) => t.year))).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
    [trophies],
  );

  const trophyClubs = useMemo(
    () => new Set(trophies.map((t) => t.clubId)).size,
    [trophies],
  );

  const favoriteCount = useMemo(
    () => trophies.filter((t) => favorites.includes(t.id)).length,
    [favorites, trophies],
  );

  const filtered = useMemo(
    () => trophies.filter((t) => {
      if (clubFilter !== "all" && t.clubId !== clubFilter) return false;
      if (yearFilter !== "all" && t.year !== yearFilter) return false;
      if (q && ![t.competition, t.year, t.country].join(" ").toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }),
    [trophies, clubFilter, yearFilter, q],
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    return list.sort((a, b) => {
      if (sortKey === "competition") {
        return sortDirection === "desc"
          ? b.competition.localeCompare(a.competition)
          : a.competition.localeCompare(b.competition);
      }

      if (sortKey === "club") {
        const aClub = clubs.find((x) => x.id === a.clubId)?.name || "";
        const bClub = clubs.find((x) => x.id === b.clubId)?.name || "";
        return sortDirection === "desc"
          ? bClub.localeCompare(aClub)
          : aClub.localeCompare(bClub);
      }

      const aYear = a.year.split("/")[0] || a.year;
      const bYear = b.year.split("/")[0] || b.year;
      const compare = aYear.localeCompare(bYear, undefined, { numeric: true });
      return sortDirection === "desc" ? -compare : compare;
    });
  }, [filtered, sortKey, sortDirection, clubs]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Sala de Troféus"
        subtitle={`${trophies.length} títulos no museu`}
        icon={<Trophy className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button disabled={clubs.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </DialogTrigger>
            <TrophyDialog
              trophy={editing}
              clubs={clubs}
              onSave={(data) => {
                if (editing) update(editing.id, data);
                else add(data);
                toast.success(editing ? "Atualizado" : "Adicionado");
                setOpen(false); setEditing(null);
              }}
              onDelete={editing ? () => {
                if (confirm("Apagar troféu?")) {
                  del(editing.id); toast.success("Apagado");
                  setOpen(false); setEditing(null);
                }
              } : undefined}
              onDuplicate={editing ? () => {
                add({
                  competition: editing.competition,
                  year: editing.year,
                  clubId: editing.clubId,
                  country: editing.country,
                  image: editing.image,
                  summary: editing.summary,
                });
                toast.success("Duplicado");
                setOpen(false); setEditing(null);
              } : undefined}
            />
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Troféus" value={trophies.length} icon={Trophy} accent />
        <StatCard label="Clubes" value={trophyClubs} icon={Sparkles} />
        <StatCard label="Épocas" value={years.length} icon={CalendarDays} />
        <StatCard label="Favoritos" value={favoriteCount} icon={Star} />
      </div>

      <div className="card-elevated rounded-2xl p-4 mb-6 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_minmax(220px,280px)_minmax(220px,280px)] lg:grid-cols-[1.2fr_1fr_1fr] items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar competição, país…" value={q} onChange={(e) => setQ(e.target.value)} />
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

        <Select value={clubFilter} onValueChange={setClubFilter}>
          <SelectTrigger className="w-full"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Filtrar por clube" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clubes</SelectItem>
            {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
            <SelectTrigger className="w-full"><ArrowUpDown className="h-3 w-3 mr-1" /><SelectValue placeholder="Ordenar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="year">Ano</SelectItem>
              <SelectItem value="club">Clube</SelectItem>
              <SelectItem value="competition">Competição</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortDirection} onValueChange={(v) => setSortDirection(v as any)}>
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
            <p className="text-sm text-muted-foreground">
              {filtered.length} de {trophies.length} troféus
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode((mode) => (mode === "grid" ? "list" : "grid"))}
          >
            {viewMode === "grid" ? <List className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
            {viewMode === "grid" ? "Ver lista" : "Ver grade"}
          </Button>
        </div>
      </div>

      {clubs.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="Cria primeiro um clube" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="Sem troféus"
          description="Adiciona o primeiro título conquistado."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>} />
      ) : viewMode === "grid" ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {sorted.map((t, i) => {
            const c = clubs.find((x) => x.id === t.clubId);
            const favorite = favorites.includes(t.id);
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => { setEditing(t); setOpen(true); }}
                className="group relative card-elevated rounded-3xl p-5 text-left overflow-hidden border border-transparent transition hover:border-primary/50 hover:-translate-y-0.5"
                style={{
                  background: c ? `linear-gradient(180deg, color-mix(in oklab, ${c.color} 18%, transparent), var(--surface))` : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); toggleFavorite(t.id); }}
                  className="absolute right-4 top-4 rounded-full border border-border bg-background/90 p-2 text-muted-foreground shadow-sm hover:text-amber-500"
                  aria-label="Marcar favorito"
                >
                  {favorite ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                </button>

                <div className="aspect-square rounded-3xl bg-primary/5 grid place-items-center mb-4 overflow-hidden relative">
                  {t.image ? (
                    <img src={t.image} alt={t.competition} className="h-full w-full object-cover" />
                  ) : (
                    <Trophy className="h-16 w-16 text-primary/70 transition" />
                  )}
                  <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-background/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm">
                    {t.year}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-lg leading-tight line-clamp-2">{t.competition}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ClubBadge club={c} size="sm" />
                    {t.country && <Badge variant="outline">{t.country}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{t.summary || "Sem resumo do troféu"}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((t, i) => {
            const c = clubs.find((x) => x.id === t.clubId);
            const favorite = favorites.includes(t.id);
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => { setEditing(t); setOpen(true); }}
                className="card-elevated rounded-3xl p-5 text-left border border-transparent hover:border-primary/50 transition"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{t.year}</div>
                    <div className="font-semibold text-xl mt-2">{t.competition}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); toggleFavorite(t.id); }}
                      className="rounded-full border border-border bg-background/90 p-2 text-muted-foreground hover:text-amber-500"
                      aria-label="Marcar favorito"
                    >
                      {favorite ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                    </button>
                    <Badge variant="outline">{c?.name || "Clube"}</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <p className="text-sm text-muted-foreground">{t.summary || "Sem resumo do troféu"}</p>
                  {t.country && <Badge>{t.country}</Badge>}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrophyDialog({ trophy, clubs, onSave, onDelete, onDuplicate }: {
  trophy: TrophyT | null;
  clubs: import("@/lib/types").Club[];
  onSave: (t: Omit<TrophyT, "id">) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  const [form, setForm] = useState<Omit<TrophyT, "id">>(trophy || {
    competition: "",
    year: "",
    clubId: clubs[0]?.id || "",
    country: "",
    image: "",
    summary: "",
  });

  useEffect(() => {
    setForm(trophy || {
      competition: "",
      year: "",
      clubId: clubs[0]?.id || "",
      country: "",
      image: "",
      summary: "",
    });
  }, [trophy, clubs]);

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
      <DialogHeader><DialogTitle>{trophy ? "Editar troféu" : "Novo troféu"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <ImageUpload value={form.image} onChange={(v) => setForm({ ...form, image: v })} aspect="square" label="Imagem do troféu" />
        <Field label="Competição">
          <Input value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} placeholder="Premier League" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ano / Época">
            <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2025/26" />
          </Field>
          <Field label="País">
            <Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </Field>
        </div>
        <Field label="Clube">
          <Select value={form.clubId} onValueChange={(v) => setForm({ ...form, clubId: v })}>
            <SelectTrigger><SelectValue placeholder="Escolher clube" /></SelectTrigger>
            <SelectContent>
              {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Resumo">
          <Textarea rows={3} value={form.summary || ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </Field>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-wrap gap-2">
            {onDelete ? <Button variant="destructive" onClick={onDelete}>Apagar</Button> : null}
            {onDuplicate ? <Button variant="outline" onClick={onDuplicate}>Duplicar</Button> : null}
          </div>
          <Button onClick={() => {
            if (!form.competition || !form.year || !form.clubId) return toast.error("Preenche os campos obrigatórios");
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
  icon: typeof Trophy;
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
