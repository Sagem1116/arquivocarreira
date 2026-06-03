import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Trophy,
  Shield,
  CalendarDays,
  Medal,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useArchive } from "@/lib/store";
import { uniqueSeasonYears, uniqueSeasonYearsByClub } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { ClubBadge } from "@/components/ClubBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Dashboard — FM Career Archive" }],
  }),
});

function Dashboard() {
  const data = useArchive((s) => s.data);
  const { clubs, seasons, trophies, awards, profile } = data;

  const totalMatches = seasons.reduce((a, s) => a + (s.matches || 0), 0);
  const totalWins = seasons.reduce((a, s) => a + (s.wins || 0), 0);
  const winPct = totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0;

  const currentClub = clubs[clubs.length - 1];
  const recentTrophies = [...trophies].slice(-4).reverse();
  const recentSeasons = [...seasons].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  const stats = [
    { label: "Clubes", value: clubs.length, icon: Shield, to: "/clubs" },
    { label: "Temporadas", value: uniqueSeasonYears(seasons), icon: CalendarDays, to: "/seasons" },
    { label: "Troféus", value: trophies.length, icon: Trophy, to: "/trophies" },
    { label: "Prémios", value: awards.length, icon: Medal, to: "/awards" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl card-elevated p-8 mb-8"
        style={{ backgroundImage: "var(--gradient-glow)" }}
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary/40 glow shrink-0">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center bg-primary/10 text-primary text-2xl font-bold">
                {profile.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-[0.3em] text-primary/80">Treinador</div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">
              <span className="text-gradient">{profile.name || "Sem nome"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.nationality || "—"} ·{" "}
              {profile.favoriteStyle || "Estilo por definir"}
            </p>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              Editar perfil <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Jogos" value={totalMatches} />
          <KPI label="Vitórias" value={totalWins} />
          <KPI label="% Vitórias" value={`${winPct}%`} accent />
          <KPI label="Troféus" value={trophies.length} accent />
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Link key={s.label} to={s.to} className="group">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-elevated rounded-2xl p-5 hover:border-primary/60 transition-all group-hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
                <s.icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition" />
              </div>
              <div className="mt-2 text-3xl font-bold">{s.value}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Current club + recent trophies */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 card-elevated rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Clube Atual
            </h3>
            <Link to="/clubs" className="text-xs text-muted-foreground hover:text-primary">
              Ver todos
            </Link>
          </div>
          {currentClub ? (
            <Link
              to="/clubs/$id"
              params={{ id: currentClub.id }}
              className="block group"
            >
              <div
                className="h-28 rounded-xl mb-4 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${currentClub.color}, color-mix(in oklab, ${currentClub.color} 50%, black))`,
                }}
              >
                {currentClub.banner && (
                  <img src={currentClub.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                )}
              </div>
              <ClubBadge club={currentClub} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">
                {currentClub.country} · {currentClub.stadium || "—"}
              </p>
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground">Adiciona o teu primeiro clube.</div>
          )}
        </div>

        <div className="lg:col-span-2 card-elevated rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Últimos Troféus
            </h3>
            <Link to="/trophies" className="text-xs text-muted-foreground hover:text-primary">
              Ver todos
            </Link>
          </div>
          {recentTrophies.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem troféus ainda.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentTrophies.map((t) => {
                const c = clubs.find((x) => x.id === t.clubId);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-muted/20 p-3 hover:border-primary/60 transition group"
                  >
                    <div className="aspect-square rounded-lg bg-primary/5 grid place-items-center mb-2 overflow-hidden">
                      {t.image ? (
                        <img src={t.image} className="h-full w-full object-cover" />
                      ) : (
                        <Trophy className="h-8 w-8 text-primary/60 group-hover:scale-110 transition" />
                      )}
                    </div>
                    <div className="text-xs font-semibold truncate">{t.competition}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      {t.year} · {c?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="card-elevated rounded-2xl p-6 mb-8">
        <h3 className="font-semibold flex items-center gap-2 mb-6">
          <Sparkles className="h-4 w-4 text-primary" /> Timeline da Carreira
        </h3>
        {clubs.length === 0 ? (
          <div className="text-sm text-muted-foreground">A timeline aparece quando adicionares clubes.</div>
        ) : (
          <div className="relative pl-6 border-l-2 border-primary/30 space-y-5">
            {clubs.map((c) => {
              const clubTrophies = trophies.filter((t) => t.clubId === c.id).length;
              const clubSeasons = uniqueSeasonYearsByClub(seasons, c.id);
              return (
                <Link
                  key={c.id}
                  to="/clubs/$id"
                  params={{ id: c.id }}
                  className="block relative group"
                >
                  <span
                    className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-background"
                    style={{ background: c.color }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 hover:bg-muted/30 transition">
                    <div className="flex items-center gap-3">
                      <ClubBadge club={c} size="md" showName={false} />
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.startDate || "—"} {c.endDate ? `→ ${c.endDate}` : "· em curso"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{clubSeasons} épocas</span>
                      <span className="text-primary font-semibold">
                        {clubTrophies} troféus
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent seasons */}
      <div className="card-elevated rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Últimas Temporadas
          </h3>
          <Link to="/seasons">
            <Button size="sm" variant="ghost">
              <Plus className="h-3.5 w-3.5 mr-1" /> Nova
            </Button>
          </Link>
        </div>
        {recentSeasons.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem temporadas registadas.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {recentSeasons.map((s) => {
              const c = clubs.find((x) => x.id === s.clubId);
              const wp = s.matches ? Math.round(((s.wins || 0) / s.matches) * 100) : 0;
              return (
                <Link
                  key={s.id}
                  to="/seasons/$id"
                  params={{ id: s.id }}
                  className="rounded-xl border border-border p-4 hover:border-primary/60 transition flex items-center gap-4"
                >
                  <div
                    className="w-1 self-stretch rounded-full"
                    style={{ background: c?.color || "var(--primary)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{s.year}</div>
                    <div className="text-xs text-muted-foreground truncate">{c?.name || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{wp}%</div>
                    <div className="text-[10px] text-muted-foreground">vitórias</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-background/40 backdrop-blur border border-border px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
