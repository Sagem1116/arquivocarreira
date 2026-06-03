import { useArchive } from "@/lib/store";
import type { Club } from "@/lib/types";

export function useClubMap(): Map<string, Club> {
  const clubs = useArchive((s) => s.data.clubs);
  return new Map(clubs.map((c) => [c.id, c]));
}

import { cn } from "@/lib/utils";

export function ClubBadge({
  club,
  size = "md",
  showName = true,
}: {
  club?: Club;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  if (!club)
    return <span className="text-muted-foreground text-sm">—</span>;
  const sz =
    size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-12 w-12 text-base" : "h-8 w-8 text-xs";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "grid place-items-center overflow-hidden rounded-md shrink-0",
          !club.logo && "border border-border",
          sz,
        )}
        style={{ background: club.logo ? "transparent" : club.color || "var(--primary)" }}
      >
        {club.logo ? (
          <img src={club.logo} alt={club.name} className="h-full w-full object-contain" />
        ) : (
          <span className="font-bold text-white drop-shadow">
            {club.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      {showName && <span className="truncate font-medium">{club.name}</span>}
    </span>
  );
}
