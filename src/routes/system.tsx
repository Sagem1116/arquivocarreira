import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Settings, Download, Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { useArchive } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllSeasonFiles, isLinkFile, signedUrl } from "@/lib/season-files";

export const Route = createFileRoute("/system")({
  component: System,
  head: () => ({ meta: [{ title: "Sistema — FM Career Archive" }] }),
});

type ExportedImage = { path: string; name: string; dataBase64: string };
type ExportedCloudFile = {
  id: string;
  season_id: string;
  name: string;
  mime_type: string | null;
  size: number;
  storage_path: string;
  created_at: string;
  isLink: boolean;
  dataBase64?: string;
  images?: ExportedImage[];
};

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)) as any);
  }
  return btoa(bin);
}

function base64ToBlob(b64: string, type?: string): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: type || "application/octet-stream" });
}

function System() {
  const data = useArchive((s) => s.data);
  const importJSON = useArchive((s) => s.importJSON);
  const reset = useArchive((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const exportJSON = async () => {
    setBusy("export");
    try {
      const cloudRows = await fetchAllSeasonFiles();
      const fileMeta = data.fileMeta || {};
      const cloudFiles: ExportedCloudFile[] = [];
      for (const row of cloudRows) {
        const link = isLinkFile(row);
        const exp: ExportedCloudFile = { ...row, isLink: link };
        if (!link) {
          try {
            const url = await signedUrl(row.storage_path);
            const blob = await (await fetch(url)).blob();
            exp.dataBase64 = await blobToBase64(blob);
          } catch (e) { console.warn("skip file", row.storage_path, e); }
        }
        const meta = fileMeta[row.id];
        if (meta?.images?.length) {
          const imgs: ExportedImage[] = [];
          for (const img of meta.images) {
            try {
              const url = await signedUrl(img.path);
              const blob = await (await fetch(url)).blob();
              imgs.push({ path: img.path, name: img.name, dataBase64: await blobToBase64(blob) });
            } catch (e) { console.warn("skip image", img.path, e); }
          }
          exp.images = imgs;
        }
        cloudFiles.push(exp);
      }
      const payload = { ...data, cloudFiles };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fm-archive-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Backup exportado (${cloudFiles.length} ficheiros)`);
    } catch (e: any) {
      toast.error(e.message || "Erro a exportar");
    } finally {
      setBusy(null);
    }
  };

  const restoreCloud = async (cloudFiles: ExportedCloudFile[]) => {
    for (const f of cloudFiles) {
      if (!f.isLink && f.dataBase64) {
        const blob = base64ToBlob(f.dataBase64, f.mime_type || undefined);
        await supabase.storage.from("season-files").upload(f.storage_path, blob, {
          contentType: f.mime_type || "application/octet-stream",
          upsert: true,
        });
      }
      for (const img of f.images || []) {
        const blob = base64ToBlob(img.dataBase64);
        await supabase.storage.from("season-files").upload(img.path, blob, { upsert: true });
      }
      await (supabase.from as any)("season_files").upsert({
        id: f.id,
        season_id: f.season_id,
        name: f.name,
        mime_type: f.mime_type,
        size: f.size,
        storage_path: f.storage_path,
        created_at: f.created_at,
      });
    }
  };

  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const trophyRows = data.trophies.map((t) => {
      const c = data.clubs.find((x) => x.id === t.clubId);
      return `<tr><td>${t.year}</td><td>${t.competition}</td><td>${c?.name || "—"}</td></tr>`;
    }).join("");
    const seasonRows = data.seasons.map((s) => {
      const c = data.clubs.find((x) => x.id === s.clubId);
      const wp = s.matches ? Math.round(((s.wins || 0) / s.matches) * 100) : 0;
      return `<tr><td>${s.year}</td><td>${c?.name || "—"}</td><td>${s.finalPosition || "—"}</td><td>${wp}%</td></tr>`;
    }).join("");
    w.document.write(`
      <html><head><title>Carreira de ${data.profile.name}</title>
      <style>
        body{font-family:Inter,system-ui,sans-serif;background:#111;color:#eee;padding:48px;max-width:900px;margin:auto}
        h1{color:#FF7A1A;font-size:36px;margin:0}
        h2{color:#FF7A1A;border-bottom:1px solid #333;padding-bottom:6px;margin-top:32px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #222;font-size:13px}
        th{color:#FF7A1A;text-transform:uppercase;font-size:10px;letter-spacing:2px}
        .meta{color:#888;font-size:14px;margin-top:8px}
      </style></head><body>
      <h1>${data.profile.name}</h1>
      <div class="meta">${data.profile.nationality || ""} · ${data.profile.favoriteStyle || ""}</div>
      <h2>Clubes (${data.clubs.length})</h2>
      <table><tr><th>Clube</th><th>País</th><th>Período</th></tr>
      ${data.clubs.map(c => `<tr><td>${c.name}</td><td>${c.country || "—"}</td><td>${c.startDate || "—"} → ${c.endDate || "atual"}</td></tr>`).join("")}
      </table>
      <h2>Troféus (${data.trophies.length})</h2>
      <table><tr><th>Ano</th><th>Competição</th><th>Clube</th></tr>${trophyRows}</table>
      <h2>Temporadas (${data.seasons.length})</h2>
      <table><tr><th>Época</th><th>Clube</th><th>Posição</th><th>% Vit</th></tr>${seasonRows}</table>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Sistema" subtitle="Backups, importação e gestão de dados"
        icon={<Settings className="h-5 w-5" />} />

      <div className="grid md:grid-cols-2 gap-5">
        <Tile icon={<Download className="h-5 w-5" />} title="Exportar JSON"
          description="Backup completo (clubes, temporadas, troféus, ficheiros, links e imagens de jogos/saves).">
          <Button onClick={exportJSON} disabled={busy !== null} className="w-full">
            {busy === "export" ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            {busy === "export" ? "A exportar…" : "Descarregar"}
          </Button>
        </Tile>

        <Tile icon={<Upload className="h-5 w-5" />} title="Importar JSON"
          description="Restaurar a partir de um backup anterior (inclui ficheiros, links e imagens).">
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader();
              r.onload = async () => {
                try {
                  const parsed = JSON.parse(r.result as string);
                  if (!parsed.version) throw new Error("Backup inválido");
                  if (!confirm("Substituir os dados atuais pelo backup?")) return;
                  setBusy("import");
                  const { cloudFiles, ...archive } = parsed as any;
                  importJSON(archive);
                  if (Array.isArray(cloudFiles) && cloudFiles.length) {
                    await restoreCloud(cloudFiles as ExportedCloudFile[]);
                  }
                  toast.success(`Backup importado (${cloudFiles?.length || 0} ficheiros)`);
                } catch (err: any) {
                  toast.error(err.message || "Erro a ler ficheiro");
                } finally {
                  setBusy(null);
                  if (fileRef.current) fileRef.current.value = "";
                }
              };
              r.readAsText(f);
            }} />
          <Button onClick={() => fileRef.current?.click()} variant="outline" className="w-full" disabled={busy !== null}>
            {busy === "import" ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
            {busy === "import" ? "A importar…" : "Selecionar ficheiro"}
          </Button>
        </Tile>


        <Tile icon={<FileText className="h-5 w-5" />} title="Exportar PDF"
          description="Resumo bonito da tua carreira pronto a imprimir.">
          <Button onClick={exportPDF} className="w-full"><FileText className="h-4 w-4 mr-1.5" /> Gerar PDF</Button>
        </Tile>

        <Tile icon={<Trash2 className="h-5 w-5" />} title="Reset completo"
          description="Apaga toda a base de dados. Irreversível." danger>
          <Button variant="destructive" className="w-full"
            onClick={() => {
              if (confirm("Tens a certeza? Esta ação apaga TODOS os dados.") && confirm("Confirmas mesmo?")) {
                reset(); toast.success("Tudo apagado");
              }
            }}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Apagar tudo
          </Button>
        </Tile>
      </div>

      <div className="card-elevated rounded-2xl p-5 mt-6 text-xs text-muted-foreground space-y-1">
        <div>📦 Dados guardados localmente em <code className="text-primary">IndexedDB</code> do browser.</div>
        <div>🖼️ Imagens em <code className="text-primary">base64</code> — sem servidores externos.</div>
        <div>🔄 Auto-save em todas as edições.</div>
      </div>
    </div>
  );
}

function Tile({ icon, title, description, children, danger }: {
  icon: React.ReactNode; title: string; description: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className={`card-elevated rounded-2xl p-5 ${danger ? "border-destructive/40" : ""}`}>
      <div className="flex items-center gap-3 mb-1">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${danger ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      {children}
    </div>
  );
}
