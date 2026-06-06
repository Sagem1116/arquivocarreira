import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useArchive } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { ClubBadge } from "@/components/ClubBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Route = createFileRoute("/seasons/")({
  component: Seasons,
  head: () => ({ meta: [{ title: "Temporadas — FM Career Archive" }] }),
});

function Seasons() {
  const seasons = useArchive((s) => s.data.seasons);
  const clubs = useArchive((s) => s.data.clubs);
  const addSeason = useArchive((s) => s.addSeason);
  const persist = useArchive((s) => s.persist);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("");
  const [clubId, setClubId] = useState("");
  const [isPartial, setIsPartial] = useState(false);

  const ordered = [...seasons].sort((a, b) => (b.year > a.year ? 1 : -1));

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Temporadas"
        subtitle={`${seasons.length} épocas registadas`}
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={clubs.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova temporada</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Época</Label>
                  <Input placeholder="2025/26" value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Clube</Label>
                  <Select value={clubId} onValueChange={setClubId}>
                    <SelectTrigger><SelectValue placeholder="Escolher clube" /></SelectTrigger>
                    <SelectContent>
                      {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-3">
                  <Checkbox checked={isPartial} onCheckedChange={(v) => setIsPartial(v === true)} />
                  <span className="text-sm text-muted-foreground">Temporada incompleta</span>
                </label>
                <Button
                  className="w-full"
                  onClick={async () => {
                    if (!year || !clubId) return toast.error("Preenche época e clube");
                    const s = addSeason({
                      year,
                      clubId,
                      isPartial,
                      competitions: [],
                      gallery: [],
                      moments: [],
                    });
                    await persist();
                    toast.success("Temporada criada");
                    setOpen(false); setYear(""); setClubId(""); setIsPartial(false);
                    void navigate({ to: "/seasons/$id", params: { id: s.id } });
                  }}
                >Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {clubs.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="Cria primeiro um clube"
          description="Cada temporada está associada a um clube ou seleção." />
      ) : ordered.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="Sem temporadas"
          description="Adiciona a primeira temporada para começar o teu arquivo."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova temporada</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordered.map((s, i) => {
            const c = clubs.find((x) => x.id === s.clubId);
            const wp = s.matches ? Math.round(((s.wins || 0) / s.matches) * 100) : 0;
            const wonComps = s.competitions.filter((x) => x.won).length;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to="/seasons/$id" params={{ id: s.id }}>
                  <div className="card-elevated rounded-2xl p-5 hover:border-primary/60 hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                            <div className="flex flex-wrap items-center gap-2">
                          <div className="text-2xl font-bold text-gradient">{s.year}</div>
                          {s.isPartial && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-600">
                              Incompleta
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.finalPosition || "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">{wp}%</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">vitórias</div>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <ClubBadge club={c} size="sm" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.matches || 0} jogos</span>
                      {wonComps > 0 && (
                        <span className="text-primary font-semibold">🏆 {wonComps}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
