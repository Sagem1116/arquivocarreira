import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, Sparkles, ChevronDown, Shield, Flag, Globe2, Image as ImageIcon } from "lucide-react";
import { useArchive } from "@/lib/store";
import { uniqueSeasonYearsByClub } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { ClubBadge } from "@/components/ClubBadge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Lightbox } from "@/components/Lightbox";


export const Route = createFileRoute("/career-timeline")({
  component: CareerTimeline,
  head: () => ({
    meta: [{ title: "Timeline da carreira — FM Career Archive" }],
  }),
});

function CareerTimeline() {
  const data = useArchive((s) => s.data);
  const { clubs, seasons, trophies } = data;
  const [filter, setFilter] = useState<"all" | "clubs" | "selections">("all");
  const [lb, setLb] = useState<{ images: string[]; index: number } | null>(null);


  const seasonsByClub = useMemo(() => {
    const map = new Map<string, typeof seasons>();
    clubs.forEach((club) => map.set(club.id, []));
    seasons.forEach((season) => {
      const list = map.get(season.clubId) ?? [];
      list.push(season);
      map.set(season.clubId, list);
    });
    for (const list of map.values()) {
      list.sort((a, b) => a.year.localeCompare(b.year));
    }
    return map;
  }, [clubs, seasons]);

  const sortedClubs = useMemo(() => {
    const filtered = clubs.filter((club) => {
      if (filter === "clubs") return !club.isNationalTeam;
      if (filter === "selections") return !!club.isNationalTeam;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const firstSeasonA = seasonsByClub.get(a.id)?.[0]?.year;
      const firstSeasonB = seasonsByClub.get(b.id)?.[0]?.year;
      if (firstSeasonA && firstSeasonB) return firstSeasonA.localeCompare(firstSeasonB);
      if (firstSeasonA) return -1;
      if (firstSeasonB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [clubs, filter, seasonsByClub]);

  const counts = useMemo(
    () => ({
      all: clubs.length,
      clubs: clubs.filter((club) => !club.isNationalTeam).length,
      selections: clubs.filter((club) => club.isNationalTeam).length,
    }),
    [clubs],
  );

  if (clubs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Timeline da carreira"
          subtitle="Regista clubes, temporadas e competições para ver a tua história com destaque nos títulos."
          icon={<Sparkles className="h-5 w-5" />}
        />
        <EmptyState
          title="Sem clubes na timeline"
          description="Adiciona o primeiro clube para começar a construir a tua carreira."
          action={
            <Link to="/clubs">
              <Button>Ver clubes</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Timeline da carreira"
        subtitle="Todos os clubes por onde passaste, com temporadas e competições registadas em cada época."
        icon={<Sparkles className="h-5 w-5" />}
        actions={
          <Link to="/seasons">
            <Button variant="outline">Nova temporada</Button>
          </Link>
        }
      />

      <div className="mb-6 inline-flex gap-1 rounded-2xl border border-border bg-surface p-1">
        <Button size="sm" variant={filter === "all" ? "default" : "ghost"} onClick={() => setFilter("all")}>
          <Globe2 className="h-3.5 w-3.5 mr-1.5" /> Tudo
          <span className="ml-1.5 text-[10px] opacity-70">{counts.all}</span>
        </Button>
        <Button size="sm" variant={filter === "clubs" ? "default" : "ghost"} onClick={() => setFilter("clubs")}>
          <Shield className="h-3.5 w-3.5 mr-1.5" /> Clubes
          <span className="ml-1.5 text-[10px] opacity-70">{counts.clubs}</span>
        </Button>
        <Button size="sm" variant={filter === "selections" ? "default" : "ghost"} onClick={() => setFilter("selections")}>
          <Flag className="h-3.5 w-3.5 mr-1.5" /> Seleções
          <span className="ml-1.5 text-[10px] opacity-70">{counts.selections}</span>
        </Button>
      </div>

      {sortedClubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum {filter === "clubs" ? "clube" : filter === "selections" ? "seleção" : "registo"} para este filtro.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedClubs.map((club) => {
            const clubSeasons = seasonsByClub.get(club.id) ?? [];
            const clubTrophies = trophies.filter((trophy) => trophy.clubId === club.id);
            const uniqueClubSeasonCount = uniqueSeasonYearsByClub(seasons, club.id);

            return (
              <section
                key={club.id}
                className="rounded-[1.75rem] border border-border p-4 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${club.color} 12%, color-mix(in oklab, ${club.color} 40%, var(--background) 72%))`,
                }}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-sm">
                      <ClubBadge club={club} size="lg" showName={false} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{club.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {club.startDate || "Data não informada"}
                        {club.endDate ? ` → ${club.endDate}` : " · Atual"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-white/90">
                      {uniqueClubSeasonCount} temporada{uniqueClubSeasonCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-white/90">
                      {clubTrophies.length} troféu{clubTrophies.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {clubSeasons.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                      Sem temporadas registadas para este clube.
                    </div>
                  ) : (
                    clubSeasons.map((season) => {
                      const trophiesForSeason = clubTrophies.filter((trophy) => trophy.year === season.year);

                      return (
                        <div
                          key={season.id}
                          className="overflow-hidden rounded-2xl border shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${club.color} 18%, color-mix(in oklab, ${club.color} 35%, var(--background) 75%))`,
                            borderColor: "rgba(255,255,255,0.18)",
                          }}
                        >
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <button className="w-full p-2 text-left transition-opacity hover:opacity-80 md:flex md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="text-base font-semibold text-white">{season.year}</div>
                                  {season.isPartial ? (
                                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100">
                                      Incompleta
                                    </span>
                                  ) : null}
                                  <ChevronDown className="h-4 w-4 text-white/70" />
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1 text-[10px] md:mt-0">
                                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-white/90">
                                    {season.matches || 0} jogos
                                  </span>
                                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-white/90">
                                    {season.wins || 0} vitórias
                                  </span>
                                  {season.finalPosition ? (
                                    <span className="rounded-full bg-white/12 px-2 py-0.5 text-white/80">
                                      {season.finalPosition}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="px-2 pb-2">
                              <div className="mt-3 grid gap-2 lg:grid-cols-[1.2fr_0.8fr]">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-semibold">Competições</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {season.competitions.length} registo{season.competitions.length === 1 ? "" : "s"}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    {season.competitions.length === 0 ? (
                                      <div className="rounded-3xl border border-dashed border-border p-2 text-xs text-muted-foreground">
                                        Sem competições nesta época.
                                      </div>
                                    ) : (
                                      season.competitions.map((competition) => {
                                        const imgs = competition.images || [];
                                        const hasImgs = imgs.length > 0;
                                        return (
                                        <div
                                          key={competition.id}
                                          onClick={hasImgs ? () => setLb({ images: imgs, index: 0 }) : undefined}
                                          className={`rounded-3xl border p-2 ${competition.won ? "border-primary bg-primary/10" : "border-border bg-surface"} ${hasImgs ? "cursor-pointer hover:opacity-90" : ""}`}
                                        >
                                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div>
                                              <div className="text-sm font-semibold flex items-center gap-1.5">
                                                {competition.name}
                                                {hasImgs ? <ImageIcon className="h-3 w-3 opacity-70" /> : null}
                                              </div>
                                              <div className="text-[10px] text-muted-foreground">
                                                {competition.position || "Posição não informada"}
                                              </div>
                                            </div>

                                            {competition.won ? (
                                              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                                <Trophy className="h-3 w-3" /> Título
                                              </span>
                                            ) : competition.finalReached ? (
                                              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                                                Finalista
                                              </span>
                                            ) : null}
                                          </div>

                                          {competition.notes ? (
                                            <div className="mt-2 text-xs text-muted-foreground">{competition.notes}</div>
                                          ) : null}
                                          {hasImgs ? (
                                            <div className="mt-2 flex gap-1.5 overflow-x-auto">
                                              {imgs.slice(0, 6).map((src, i) => (
                                                <img key={i} src={src} alt="" className="h-12 w-12 object-cover rounded-lg border border-border flex-shrink-0"
                                                  onClick={(e) => { e.stopPropagation(); setLb({ images: imgs, index: i }); }} />
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                        );
                                      })

                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="text-xs font-semibold">Títulos da época</div>
                                  {trophiesForSeason.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                                      Nenhum título extra registado.
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {trophiesForSeason.map((trophy) => (
                                        <div key={trophy.id} className="rounded-3xl border border-primary/60 bg-primary/10 p-2">
                                          <div className="flex items-center gap-2">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                              <Trophy className="h-3 w-3" />
                                            </span>
                                            <div>
                                              <div className="text-xs font-semibold">{trophy.competition}</div>
                                              <div className="text-[10px] text-muted-foreground">{trophy.year}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
