import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Gamepad2,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  Pencil,
  Check,
} from "lucide-react";
import { useArchive } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbox } from "@/components/Lightbox";
import {
  fetchAllSeasonFiles,
  downloadFile,
  signedUrl,
  deleteSeasonFile,
  isLinkFile,
  type CloudSeasonFile,
} from "@/lib/season-files";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/games")({
  component: GamesPage,
});

function GamesPage() {
  const fileMeta = useArchive((s) => s.data.fileMeta || {});
  const setFileMeta = useArchive((s) => s.setFileMeta);
  const removeFileMeta = useArchive((s) => s.removeFileMeta);
  const seasons = useArchive((s) => s.data.seasons);
  const clubs = useArchive((s) => s.data.clubs);
  const [files, setFiles] = useState<CloudSeasonFile[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    fetchAllSeasonFiles()
      .then((d) => setFiles(d))
      .catch(() => toast.error("Falha a carregar ficheiros"))
      .finally(() => setLoading(false));
  }, []);

  const seasonMap = useMemo(() => new Map(seasons.map((s) => [s.id, s])), [seasons]);
  const clubMap = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  const games = useMemo(
    () => files.filter((f) => fileMeta[f.id]?.kind === "game"),
    [files, fileMeta],
  );

  const handleDelete = async (f: CloudSeasonFile) => {
    if (!confirm(`Apagar ${f.name}?`)) return;
    const meta = fileMeta[f.id];
    try {
      await deleteSeasonFile(f, meta?.images.map((i) => i.path) || []);
      removeFileMeta(f.id);
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
      toast.success("Apagado");
    } catch {
      toast.error("Falha a apagar");
    }
  };

  const handleRename = (id: string, title: string) => {
    const meta = fileMeta[id] || { kind: "game" as const, images: [] };
    setFileMeta(id, { ...meta, title });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-primary/80">Arquivo</div>
          <h1 className="text-4xl font-bold text-gradient flex items-center gap-3">
            <Gamepad2 className="h-8 w-8" /> Jogos Memoráveis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os ficheiros de jogo carregados em cada temporada.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          <Button size="sm" variant={view === "grid" ? "default" : "ghost"} onClick={() => setView("grid")}>
            <LayoutGrid className="h-4 w-4 mr-1.5" /> Grade
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
            <List className="h-4 w-4 mr-1.5" /> Lista
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">A carregar…</div>
      ) : games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          <Gamepad2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
          Sem jogos memoráveis ainda. Carrega um ficheiro como <strong>Jogo</strong> na aba Ficheiros de uma temporada.
        </div>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((f) => (
            <GameCard
              key={f.id}
              file={f}
              meta={fileMeta[f.id]}
              season={seasonMap.get(f.season_id)}
              clubName={clubMap.get(seasonMap.get(f.season_id)?.clubId || "")?.name}
              onDelete={() => handleDelete(f)}
              onRename={(t) => handleRename(f.id, t)}
              onOpenLightbox={(images, index) => setLightbox({ images, index })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((f) => (
            <GameRow
              key={f.id}
              file={f}
              meta={fileMeta[f.id]}
              season={seasonMap.get(f.season_id)}
              clubName={clubMap.get(seasonMap.get(f.season_id)?.clubId || "")?.name}
              onDelete={() => handleDelete(f)}
              onRename={(t) => handleRename(f.id, t)}
              onOpenLightbox={(images, index) => setLightbox({ images, index })}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={() => {}}
        />
      )}
    </div>
  );
}

function EditableTitle({
  value,
  placeholder,
  onSave,
  className,
}: {
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draft.trim()); setEditing(false); }
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={() => { onSave(draft.trim()); setEditing(false); }}
          aria-label="Guardar título"
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn("group flex items-center gap-1.5 text-left w-full", className)}
      title="Editar título"
    >
      <span className={cn("truncate font-semibold", !value && "text-muted-foreground italic font-normal")}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
    </button>
  );
}

function GameCard({
  file, meta, season, clubName, onDelete, onRename, onOpenLightbox,
}: {
  file: CloudSeasonFile;
  meta?: { kind: "game" | "save"; title?: string; images: { path: string; name: string }[] };
  season?: { id: string; year: string };
  clubName?: string;
  onDelete: () => void;
  onRename: (t: string) => void;
  onOpenLightbox: (images: string[], index: number) => void;
}) {
  const images = meta?.images || [];
  const link = isLinkFile(file);
  const title = meta?.title || "";
  return (
    <div className="card-elevated rounded-2xl overflow-hidden flex flex-col">
      {link ? (
        <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center">
          <LinkIcon className="h-10 w-10 text-primary/70" />
        </div>
      ) : (
        <ImageStrip paths={images.map((i) => i.path)} onOpen={onOpenLightbox} />
      )}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {season ? (
            <Link to="/seasons/$id" params={{ id: season.id }} className="hover:text-primary">
              {season.year}{clubName ? ` · ${clubName}` : ""}
            </Link>
          ) : "Temporada"}
        </div>
        <EditableTitle
          value={title}
          placeholder="Adicionar título do jogo…"
          onSave={onRename}
        />
        <div className="text-xs text-muted-foreground truncate" title={file.name}>{file.name}</div>
        <div className="text-xs text-muted-foreground">
          {link ? "Link externo" : `${images.length} imagem(ns)`}
        </div>
        <div className="mt-auto flex gap-2">
          {link ? (
            <Button size="sm" className="flex-1" asChild>
              <a href={file.storage_path} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir
              </a>
            </Button>
          ) : (
            <Button size="sm" className="flex-1" onClick={() => downloadFile(file.storage_path, file.name)}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download
            </Button>
          )}
          <Button size="icon" variant="outline" onClick={onDelete} aria-label="Apagar">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function GameRow({
  file, meta, season, clubName, onDelete, onRename, onOpenLightbox,
}: {
  file: CloudSeasonFile;
  meta?: { kind: "game" | "save"; title?: string; images: { path: string; name: string }[] };
  season?: { id: string; year: string };
  clubName?: string;
  onDelete: () => void;
  onRename: (t: string) => void;
  onOpenLightbox: (images: string[], index: number) => void;
}) {
  const images = meta?.images || [];
  const link = isLinkFile(file);
  const title = meta?.title || "";
  return (
    <div className="card-elevated rounded-2xl p-4 flex flex-col md:flex-row gap-4">
      <div className="md:w-64 shrink-0">
        {link ? (
          <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center">
            <LinkIcon className="h-8 w-8 text-primary/70" />
          </div>
        ) : (
          <ImageStrip paths={images.map((i) => i.path)} compact onOpen={onOpenLightbox} />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {season ? (
            <Link to="/seasons/$id" params={{ id: season.id }} className="hover:text-primary">
              {season.year}{clubName ? ` · ${clubName}` : ""}
            </Link>
          ) : "Temporada"}
        </div>
        <EditableTitle
          value={title}
          placeholder="Adicionar título do jogo…"
          onSave={onRename}
        />
        <div className="text-xs text-muted-foreground truncate" title={file.name}>{file.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {link ? file.storage_path : `${images.length} imagem(ns)`}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {link ? (
          <Button size="sm" asChild>
            <a href={file.storage_path} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir
            </a>
          </Button>
        ) : (
          <Button size="sm" onClick={() => downloadFile(file.storage_path, file.name)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Apagar">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ImageStrip({
  paths,
  compact,
  onOpen,
}: {
  paths: string[];
  compact?: boolean;
  onOpen?: (images: string[], index: number) => void;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(paths.map((p) => signedUrl(p).catch(() => null)))
      .then((res) => {
        if (!cancelled) setUrls(res.filter(Boolean) as string[]);
      });
    return () => { cancelled = true; };
  }, [paths.join("|")]);

  if (paths.length === 0) {
    return (
      <div className={cn("w-full bg-muted/40 grid place-items-center text-muted-foreground", compact ? "aspect-video rounded-lg" : "aspect-video")}>
        <ImageIcon className="h-8 w-8 opacity-50" />
      </div>
    );
  }

  const preview = urls.slice(0, 4);
  const extra = urls.length - preview.length;

  return (
    <div
      className={cn(
        "grid gap-1",
        preview.length === 1 ? "grid-cols-1" : "grid-cols-2",
        compact ? "rounded-lg overflow-hidden" : "",
      )}
    >
      {preview.map((u, i) => {
        const isLast = i === preview.length - 1 && extra > 0;
        return (
          <button
            type="button"
            key={i}
            onClick={() => onOpen?.(urls, i)}
            className="relative block overflow-hidden group"
          >
            <img
              src={u}
              alt=""
              className={cn(
                "w-full object-cover transition-transform group-hover:scale-105",
                compact ? "aspect-square" : "aspect-square",
              )}
            />
            {isLast && (
              <div className="absolute inset-0 bg-black/60 grid place-items-center text-white font-semibold">
                +{extra}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
