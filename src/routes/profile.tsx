import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useArchive } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Perfil — FM Career Archive" }] }),
});

function Profile() {
  const profile = useArchive((s) => s.data.profile);
  const setProfile = useArchive((s) => s.setProfile);
  const data = useArchive((s) => s.data);

  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);

  const totalMatches = data.seasons.reduce((a, s) => a + (s.matches || 0), 0);
  const totalWins = data.seasons.reduce((a, s) => a + (s.wins || 0), 0);
  const winPct = totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Perfil de Treinador"
        subtitle="A tua identidade no arquivo"
        icon={<User className="h-5 w-5" />}
      />

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        <div className="card-elevated rounded-2xl p-5 space-y-5">
          <ImageUpload
            value={form.photo}
            onChange={(v) => setForm({ ...form, photo: v })}
            label="Fotografia"
            rounded
          />
          <div className="text-center">
            <div className="text-lg font-bold text-gradient">{form.name || "—"}</div>
            <div className="text-xs text-muted-foreground">{form.nationality || "—"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat v={data.clubs.length} l="Clubes" />
            <Stat v={data.trophies.length} l="Troféus" />
            <Stat v={`${winPct}%`} l="Vitórias" />
          </div>
        </div>

        <div className="card-elevated rounded-2xl p-6 space-y-4">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nacionalidade">
              <Input
                value={form.nationality || ""}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                placeholder="Portugal"
              />
            </Field>
            <Field label="Data de nascimento">
              <Input
                type="date"
                value={form.birthDate || ""}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Estilo tático favorito">
            <Input
              value={form.favoriteStyle || ""}
              onChange={(e) => setForm({ ...form, favoriteStyle: e.target.value })}
              placeholder="4-3-3 Gegenpressing"
            />
          </Field>
          <Field label="Bio / Resumo">
            <Textarea
              rows={4}
              value={form.bio || ""}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Resumo da tua filosofia, marcos importantes…"
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => {
                setProfile(form);
                toast.success("Perfil atualizado");
              }}
            >
              Guardar alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
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

function Stat({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <div className="text-lg font-bold text-primary">{v}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
    </div>
  );
}
