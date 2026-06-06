import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Save, FileText, Trash2, ExternalLink, Link as LinkIcon } from "lucide-react";
import { useArchive } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  fetchAllSeasonFiles,
  downloadFile,
  deleteSeasonFile,
  isLinkFile,
  type CloudSeasonFile,
} from "@/lib/season-files";
import { toast } from "sonner";

export const Route = createFileRoute("/saves")({
  component: SavesPage,
});


function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function SavesPage() {
  const fileMeta = useArchive((s) => s.data.fileMeta || {});
  const seasons = useArchive((s) => s.data.seasons);
  const clubs = useArchive((s) => s.data.clubs);
  const [files, setFiles] = useState<CloudSeasonFile[]>([]);
  const fileMetaState = useArchive((s) => s.data.fileMeta || {});
  const removeFileMeta = useArchive((s) => s.removeFileMeta);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSeasonFiles()
      .then((d) => setFiles(d))
      .catch(() => toast.error("Falha a carregar ficheiros"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (f: CloudSeasonFile) => {
    if (!confirm(`Apagar ${f.name}?`)) return;
    const meta = fileMetaState[f.id];
    try {
      await deleteSeasonFile(f, meta?.images.map((i) => i.path) || []);
      removeFileMeta(f.id);
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
      toast.success("Apagado");
    } catch {
      toast.error("Falha a apagar");
    }
  };


  const clubMap = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  const saves = useMemo(
    () => files.filter((f) => (fileMeta[f.id]?.kind ?? "save") === "save"),
    [files, fileMeta],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, CloudSeasonFile[]>();
    for (const f of saves) {
      const arr = map.get(f.season_id) || [];
      arr.push(f);
      map.set(f.season_id, arr);
    }
    return Array.from(map.entries()).map(([seasonId, items]) => {
      const season = seasons.find((s) => s.id === seasonId);
      return {
        seasonId,
        season,
        club: season ? clubMap.get(season.clubId) : undefined,
        items,
      };
    }).sort((a, b) => (b.season?.year || "").localeCompare(a.season?.year || ""));
  }, [saves, seasons, clubMap]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/80">Arquivo</div>
        <h1 className="text-4xl font-bold text-gradient flex items-center gap-3">
          <Save className="h-8 w-8" /> Saves
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todos os saves carregados, agrupados por temporada.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">A carregar…</div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          <Save className="h-10 w-10 mx-auto mb-3 opacity-50" />
          Sem saves ainda. Carrega um ficheiro como <strong>Save</strong> na aba Ficheiros de uma temporada.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g.seasonId}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-xl font-semibold">
                  {g.season ? (
                    <Link to="/seasons/$id" params={{ id: g.season.id }} className="hover:text-primary">
                      {g.season.year}
                    </Link>
                  ) : "Temporada desconhecida"}
                  {g.club && <span className="text-muted-foreground font-normal"> · {g.club.name}</span>}
                </h2>
                <span className="text-xs text-muted-foreground">{g.items.length} ficheiro(s)</span>
              </div>
              <div className="space-y-2">
                {g.items.map((f) => {
                  const link = isLinkFile(f);
                  return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:border-primary/40 transition"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      {link ? <LinkIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {link
                          ? f.storage_path
                          : `${formatBytes(f.size)} · ${new Date(f.created_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    {link ? (
                      <Button size="sm" variant="outline" asChild>
                        <a href={f.storage_path} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => downloadFile(f.storage_path, f.name)}>
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(f)} aria-label="Apagar">
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
