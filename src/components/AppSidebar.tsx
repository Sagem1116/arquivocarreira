import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  User,
  Shield,
  CalendarDays,
  Trophy,
  Medal,
  Sparkles,
  BarChart3,
  Settings,
  Archive,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Gamepad2,
  Save,
} from "lucide-react";
import { useArchive } from "@/lib/store";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/clubs", label: "Clubes", icon: Shield },
  { to: "/seasons", label: "Temporadas", icon: CalendarDays },
  { to: "/career-timeline", label: "Timeline", icon: Sparkles },
  { to: "/trophies", label: "Títulos", icon: Trophy },
  { to: "/awards", label: "Prémios", icon: Medal },
  { to: "/mentions", label: "Menções", icon: Sparkles },
  { to: "/games", label: "Jogos", icon: Gamepad2 },
  { to: "/saves", label: "Saves", icon: Save },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
  { to: "/system", label: "Sistema", icon: Settings },
];


export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const data = useArchive((s) => s.data);
  const clubs = data.clubs;
  const seasons = data.seasons;

  const clubMap = useMemo(
    () => new Map(clubs.map((club) => [club.id, club])),
    [clubs],
  );

  const searchTermNormalized = searchTerm.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!searchTermNormalized) {
      return { clubs: [], seasons: [], competitions: [] };
    }

    const clubsMatches = clubs
      .filter((club) => club.name.toLowerCase().includes(searchTermNormalized))
      .slice(0, 4);

    const seasonsMatches = seasons
      .filter((season) => {
        const club = clubMap.get(season.clubId);
        return (
          season.year.toLowerCase().includes(searchTermNormalized) ||
          club?.name.toLowerCase().includes(searchTermNormalized) ||
          season.notes?.toLowerCase().includes(searchTermNormalized)
        );
      })
      .slice(0, 4);

    const competitionsMatches = seasons
      .flatMap((season) =>
        season.competitions
          .filter((competition) => {
            return (
              competition.name.toLowerCase().includes(searchTermNormalized) ||
              competition.position?.toLowerCase().includes(searchTermNormalized) ||
              competition.notes?.toLowerCase().includes(searchTermNormalized)
            );
          })
          .map((competition) => ({
            competition,
            season,
            club: clubMap.get(season.clubId),
          })),
      )
      .slice(0, 5);

    return { clubs: clubsMatches, seasons: seasonsMatches, competitions: competitionsMatches };
  }, [searchTermNormalized, clubs, seasons, clubMap]);

  const showSearchResults = Boolean(searchTermNormalized);

  return (
    <aside
      className={cn(
        "group relative hidden md:flex sticky top-0 h-screen shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar/85 text-sidebar-foreground shadow-[0_35px_80px_-40px_rgba(0,0,0,0.72)] backdrop-blur-3xl ring-1 ring-sidebar-border/40 transition-all duration-300 ease-out overflow-hidden glass",
        collapsed ? "w-16 hover:w-64" : "w-64",
      )}
    >
      <div className="relative overflow-hidden border-b border-sidebar-border/70 px-4 py-4 bg-sidebar/60 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_28%)] opacity-80" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/90 text-primary-foreground glow transition-transform duration-300 group-hover:scale-105 shadow-lg shadow-primary/20">
            <Archive className="h-5 w-5" />
          </div>
          <div
            className={cn(
              "min-w-0 transition-all duration-300",
              collapsed
                ? "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                : "opacity-100 visible",
            )}
          >
            <div className="text-sm font-bold uppercase tracking-[0.26em] text-gradient">
              FM CAREER
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Archive
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-sidebar-foreground transition-colors duration-200 hover:bg-white/10"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        <div
          className={cn(
            "mt-4 transition-all duration-300",
            collapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[160px] opacity-100",
          )}
        >
          <div className="relative rounded-2xl border border-sidebar-border/50 bg-sidebar/40 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar clubes, épocas, competições"
              className="w-full bg-transparent pl-10 pr-3 text-sm text-sidebar-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Pesquisa rápida
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {showSearchResults ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-sidebar-border/50 bg-sidebar/70 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl">
              Resultados de pesquisa
            </div>

            {searchResults.clubs.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Clubes</div>
                {searchResults.clubs.map((club) => (
                  <Link
                    key={club.id}
                    to={`/clubs/${club.id}`}
                    title={club.name}
                    className="group flex items-center gap-3 rounded-2xl bg-sidebar/25 px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar/45"
                  >
                    <Shield className="h-4 w-4 text-primary" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-sidebar-foreground">{club.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">Clube</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {searchResults.seasons.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Temporadas</div>
                {searchResults.seasons.map((season) => {
                  const club = clubMap.get(season.clubId);
                  return (
                    <Link
                      key={season.id}
                      to={`/seasons/${season.id}`}
                      title={`${season.year}${club ? ` · ${club.name}` : ""}`}
                      className="group flex items-center gap-3 rounded-2xl bg-sidebar/25 px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar/45"
                    >
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-sidebar-foreground">{season.year}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {club ? club.name : "Temporada"}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {searchResults.competitions.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Competições</div>
                {searchResults.competitions.map(({ competition, season, club }, index) => (
                  <Link
                    key={`${competition.id}-${index}`}
                    to={`/seasons/${season.id}`}
                    className="group flex items-center gap-3 rounded-2xl bg-sidebar/25 px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar/45"
                  >
                    <Trophy className="h-4 w-4 text-primary" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-sidebar-foreground">{competition.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {season.year} · {club?.name ?? "Temporada"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {searchResults.clubs.length === 0 &&
            searchResults.seasons.length === 0 &&
            searchResults.competitions.length === 0 ? (
                <div className="rounded-2xl border border-sidebar-border/50 bg-sidebar/70 px-3 py-3 text-sm text-muted-foreground backdrop-blur-xl">
                Nenhum resultado encontrado.
              </div>
            ) : null}
          </div>
        ) : (
          <nav className="space-y-2">
            {items.map((it) => {
              const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                      : "text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary glow" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      active ? "text-primary" : "text-sidebar-foreground/70",
                      "group-hover:scale-110",
                    )}
                  />
                  <span
                    className={cn(
                      "truncate transition-all duration-200",
                      collapsed
                        ? "max-w-0 opacity-0 invisible group-hover:max-w-full group-hover:opacity-100 group-hover:visible"
                        : "max-w-full opacity-100 visible",
                    )}
                  >
                    {it.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div
        className={cn(
          "border-t border-sidebar-border/70 px-4 py-4 transition-all duration-300",
          collapsed ? "max-h-0 opacity-0 overflow-hidden" : "max-h-40 opacity-100",
        )}
      >
        <div className="mb-3 rounded-2xl bg-sidebar/60 px-3 py-2 text-[10px] text-muted-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sidebar-foreground">Modo vibrante</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              ON
            </span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">Arquivo pessoal · v1</div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-border glass">
      {items.slice(0, 5).map((it) => {
        const Icon = it.icon;
        const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[10px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
