import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Edit2, Trophy } from "lucide-react";
import { useArchive } from "@/lib/store";
import { uniqueSeasonYearsByClub } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ClubDialog } from "./clubs.index";

export const Route = createFileRoute("/clubs/$id")({
  component: ClubDetail,
});

function ClubDetail() {
  const { id } = Route.useParams();
  const allClubs = useArchive((s) => s.data.clubs);
  const allSeasons = useArchive((s) => s.data.seasons);
  const allTrophies = useArchive((s) => s.data.trophies);
  const club = allClubs.find((c) => c.id === id);
  const seasons = allSeasons.filter((x) => x.clubId === id);
  const trophies = allTrophies.filter((x) => x.clubId === id);
  const [edit, setEdit] = useState(false);

  if (!club) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Clube não encontrado.{" "}
        <Link to="/clubs" className="text-primary underline">Voltar</Link>
      </div>
    );
  }

  const totalMatches = seasons.reduce((a, s) => a + (s.matches || 0), 0);
  const totalWins = seasons.reduce((a, s) => a + (s.wins || 0), 0);
  const winPct = totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0;
  const uniqueSeasonCount = uniqueSeasonYearsByClub(seasons, id);

  const pageBackground = {
    backgroundImage: `radial-gradient(circle at top left, ${club.color}22%, transparent 20%)`,
  };

  return (
    <div className="max-w-7xl mx-auto" style={pageBackground}>
      <Link to="/clubs" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3 w-3" /> Clubes
      </Link>

      {/* Banner */}
      <div
        className="relative rounded-3xl overflow-hidden h-56 md:h-72 mb-8 card-elevated"
        style={{ background: `linear-gradient(135deg, ${club.color}, color-mix(in oklab, ${club.color} 40%, black))` }}
      >
        {(club.banner || club.stadiumPhoto) && (
          <img src={club.banner || club.stadiumPhoto} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-wrap items-end gap-5">
          <div className="h-20 w-20 rounded-2xl border-4 border-background overflow-hidden glow shrink-0"
               style={{ background: club.logo ? "transparent" : club.color }}>
            {club.logo ? (
              <img src={club.logo} alt={club.name} className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full grid place-items-center text-white font-bold text-2xl">
                {club.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{club.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {club.country} · {club.stadium || "Sem estádio"} · {club.startDate || "—"}
              {club.endDate ? ` → ${club.endDate}` : ""}
            </p>
          </div>
          <Button variant="outline" onClick={() => setEdit(true)}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Editar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPI label="Temporadas" value={uniqueSeasonCount} />
        <KPI label="% Vitórias" value={`${winPct}%`} accent />
        <KPI label="Troféus" value={trophies.length} accent />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated rounded-2xl p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" /> Títulos neste clube
          </h3>
          {trophies.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem títulos ainda.</div>
          ) : (
            <div className="space-y-2">
              {trophies.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/30">
                  <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center overflow-hidden">
                    {t.image ? <img src={t.image} className="h-full w-full object-cover" /> : <Trophy className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t.competition}</div>
                    <div className="text-xs text-muted-foreground">{t.year}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-elevated rounded-2xl p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-primary" /> Temporadas
          </h3>
          {seasons.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem temporadas ainda.</div>
          ) : (
            <div className="space-y-2">
              {seasons.map((s) => (
                <Link
                  key={s.id}
                  to="/seasons/$id"
                  params={{ id: s.id }}
                  className="flex items-center justify-between rounded-lg p-3 border border-border hover:border-primary/60 transition"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{s.year}</div>
                      {s.isPartial && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600">
                          Incompleta
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.finalPosition || "—"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.wins || 0}V · {s.draws || 0}E · {s.losses || 0}D
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {club.notes && (
        <div className="card-elevated rounded-2xl p-6 mt-6">
          <h3 className="font-semibold mb-2">Notas</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{club.notes}</p>
        </div>
      )}

      <Dialog open={edit} onOpenChange={setEdit}>
        <ClubDialog club={club} onClose={() => setEdit(false)} />
      </Dialog>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card-elevated rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
