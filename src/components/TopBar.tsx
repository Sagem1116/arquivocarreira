import { Link } from "@tanstack/react-router";
import { Trophy as TrophyIcon, User } from "lucide-react";
import { useArchive } from "@/lib/store";

export function TopBar() {
  const profile = useArchive((s) => s.data.profile);
  const clubs = useArchive((s) => s.data.clubs);
  const trophies = useArchive((s) => s.data.trophies);

  return (
    <div className="sticky top-0 z-30 glass border-b border-border/60 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 md:px-6 py-3 overflow-x-auto scrollbar-thin">
        {/* Profile */}
        <Link
          to="/profile"
          className="flex items-center gap-2 shrink-0 group"
          title={profile.name}
        >
          <div className="h-9 w-9 rounded-full overflow-hidden border border-primary/40 glow shrink-0 bg-background/40">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-primary">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
          <span className="hidden sm:block text-xs font-semibold tracking-wide max-w-[120px] truncate group-hover:text-primary transition">
            {profile.name || "Treinador"}
          </span>
        </Link>

        <div className="h-8 w-px bg-border/60 shrink-0" />

        {/* Clubs */}
        {clubs.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {clubs.map((c) => (
              <Link
                key={c.id}
                to="/clubs/$id"
                params={{ id: c.id }}
                title={c.name}
                className="relative shrink-0 transition-transform hover:-translate-y-0.5"
              >
                <span
                  className="grid place-items-center h-9 w-9 rounded-md overflow-hidden ring-1 ring-border hover:ring-primary/60 transition"
                  style={{
                    background: c.logo ? "transparent" : c.color || "var(--primary)",
                  }}
                >
                  {c.logo ? (
                    <img
                      src={c.logo}
                      alt={c.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-white drop-shadow">
                      {c.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}

        {trophies.length > 0 && (
          <>
            <div className="h-8 w-px bg-border/60 shrink-0" />
            {/* Trophies */}
            <div className="flex items-center gap-2 shrink-0">
              {trophies.map((t) => (
                <Link
                  key={t.id}
                  to="/trophies"
                  title={`${t.competition} · ${t.year}`}
                  className="shrink-0 transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid place-items-center h-9 w-9 rounded-md overflow-hidden ring-1 ring-primary/30 hover:ring-primary transition bg-primary/5">
                    {t.image ? (
                      <img
                        src={t.image}
                        alt={t.competition}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <TrophyIcon className="h-4 w-4 text-primary" />
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="ml-auto" />
      </div>
    </div>
  );
}
