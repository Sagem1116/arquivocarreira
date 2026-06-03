import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Plus, Search, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { useArchive } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Club } from "@/lib/types";

export const Route = createFileRoute("/clubs/")({
  component: ClubsList,
  head: () => ({ meta: [{ title: "Clubes — FM Career Archive" }] }),
});

function ClubsList() {
  const clubs = useArchive((s) => s.data.clubs);
  const trophies = useArchive((s) => s.data.trophies);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = clubs.filter((c) =>
    [c.name, c.country, c.stadium].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Clubes & Seleções"
        subtitle={`${clubs.length} no arquivo`}
        icon={<Shield className="h-5 w-5" />}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8 w-44"
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </DialogTrigger>
              <ClubDialog onClose={() => setOpen(false)} />
            </Dialog>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="Sem clubes ainda"
          description="Adiciona o teu primeiro clube ou seleção."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar clube
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => {
            const tCount = trophies.filter((t) => t.clubId === c.id).length;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to="/clubs/$id" params={{ id: c.id }} className="block group">
                  <div className="card-elevated rounded-2xl overflow-hidden hover:border-primary/60 transition-all group-hover:-translate-y-1">
                    <div
                      className="relative h-32"
                      style={{
                        background: `linear-gradient(135deg, ${c.color}, color-mix(in oklab, ${c.color} 40%, black))`,
                      }}
                    >
                      {c.banner && (
                        <img src={c.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      )}
                      <div className="absolute -bottom-7 left-5 h-14 w-14 rounded-xl border-2 border-background overflow-hidden grid place-items-center"
                           style={{ background: c.logo ? "transparent" : c.color }}>
                        {c.logo ? (
                          <img src={c.logo} alt={c.name} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-white font-bold">{c.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      {c.isNationalTeam && (
                        <span className="absolute top-3 right-3 rounded-full bg-background/70 backdrop-blur px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                          <Flag className="h-3 w-3" /> Seleção
                        </span>
                      )}
                    </div>
                    <div className="p-5 pt-9">
                      <h3 className="font-bold text-lg truncate">{c.name}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.country || "—"} · {c.stadium || "—"}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {c.startDate || "—"}{c.endDate ? ` → ${c.endDate}` : ""}
                        </span>
                        <span className="font-semibold text-primary">{tCount} 🏆</span>
                      </div>
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

export function ClubDialog({
  club,
  onClose,
}: {
  club?: Club;
  onClose: () => void;
}) {
  const addClub = useArchive((s) => s.addClub);
  const updateClub = useArchive((s) => s.updateClub);
  const deleteClub = useArchive((s) => s.deleteClub);

  const [form, setForm] = useState<Omit<Club, "id">>(
    club || {
      name: "",
      color: "#FF7A1A",
      country: "",
      stadium: "",
      isNationalTeam: false,
    },
  );

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (club) {
      updateClub(club.id, form);
      toast.success("Clube atualizado");
    } else {
      addClub(form);
      toast.success("Clube adicionado");
    }
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
      <DialogHeader>
        <DialogTitle>{club ? "Editar clube" : "Novo clube"}</DialogTitle>
      </DialogHeader>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-widest mb-1.5 block">Logotipo</Label>
          <ImageUpload
            value={form.logo}
            onChange={(v) => setForm({ ...form, logo: v })}
            aspect="square"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest mb-1.5 block">Banner / Estádio</Label>
          <ImageUpload
            value={form.banner || form.stadiumPhoto}
            onChange={(v) => setForm({ ...form, banner: v, stadiumPhoto: v })}
            aspect="video"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nome">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="País">
          <Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </Field>
        <Field label="Estádio">
          <Input value={form.stadium || ""} onChange={(e) => setForm({ ...form, stadium: e.target.value })} />
        </Field>
        <Field label="Cor (hex RGB)">
          <div className="flex gap-2">
            <Input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-14 p-1 h-10"
            />
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
        </Field>
        <Field label="Início (data)">
          <Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </Field>
        <Field label="Fim (data)">
          <Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </Field>
      </div>

      <Field label="Notas">
        <Textarea
          rows={3}
          value={form.notes || ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label className="text-sm">É seleção nacional?</Label>
        <Switch
          checked={!!form.isNationalTeam}
          onCheckedChange={(v) => setForm({ ...form, isNationalTeam: v })}
        />
      </div>

      <div className="flex justify-between pt-2">
        {club ? (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Apagar este clube? Temporadas e troféus associados também serão apagados.")) {
                deleteClub(club.id);
                toast.success("Apagado");
                onClose();
              }
            }}
          >
            Apagar
          </Button>
        ) : <span />}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </div>
      </div>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
