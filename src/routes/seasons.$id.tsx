import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useId } from "react";
import { ArrowLeft, Trophy, Plus, X, Image as ImageIcon, Sparkles, Upload, Trash2, FileText, Download, Paperclip, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useArchive, uid } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClubBadge } from "@/components/ClubBadge";
import { Lightbox } from "@/components/Lightbox";
import { readFilesAsBase64 } from "@/components/ImageUpload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Season, SeasonGalleryImage } from "@/lib/types";

export const Route = createFileRoute("/seasons/$id")({
  component: SeasonDetail,
});

function SeasonDetail() {
  const { id } = Route.useParams();
  const season = useArchive((s) => s.data.seasons.find((x) => x.id === id));
  const club = useArchive((s) => season && s.data.clubs.find((c) => c.id === season.clubId));
  const update = useArchive((s) => s.updateSeason);
  const del = useArchive((s) => s.deleteSeason);
  const [draft, setDraft] = useState<Season | undefined>(season);
  const [lb, setLb] = useState<{ images: string[]; index: number } | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(season), [season]);

  if (!season || !draft) {
    return <div className="text-center py-20 text-muted-foreground">Temporada não encontrada. <Link to="/seasons" className="text-primary underline">Voltar</Link></div>;
  }

  const save = (patch: Partial<Season>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    update(season.id, patch);
  };

  const wp = draft.matches ? Math.round(((draft.wins || 0) / draft.matches) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <Link to="/seasons" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3 w-3" /> Temporadas
      </Link>

      {/* Hero */}
      <div className="card-elevated rounded-3xl p-8 mb-8 relative overflow-hidden"
           style={{
             backgroundImage: club ?
               `linear-gradient(135deg, ${club.color}, color-mix(in oklab, ${club.color} 45%, black))`
               : "var(--gradient-glow)",
           }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-primary/80">Temporada</div>
            <h1 className="text-5xl md:text-6xl font-bold text-gradient mt-1">{draft.year}</h1>
            {draft.isPartial && (
              <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-600">
                Temporada incompleta
              </span>
            )}
            <div className="mt-3"><ClubBadge club={club} size="md" /></div>
          </div>
          <div className="flex items-center gap-3">
            <KPI label="Jogos" value={draft.matches || 0} />
            <KPI label="Vit %" value={`${wp}%`} accent />
            <KPI label="Títulos" value={draft.competitions.filter((c) => c.won).length} accent />
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="mb-6">
          <TabsTrigger value="info">Informação</TabsTrigger>
          <TabsTrigger value="competitions">Competições</TabsTrigger>
          <TabsTrigger value="transfers">Transferências</TabsTrigger>
          <TabsTrigger value="squad">Plantel</TabsTrigger>
          <TabsTrigger value="tactic">Tática</TabsTrigger>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="moments">Momentos</TabsTrigger>
          <TabsTrigger value="files">Ficheiros</TabsTrigger>
        </TabsList>

        {/* INFO */}
        <TabsContent value="info">
          <div className="card-elevated rounded-2xl p-6 grid md:grid-cols-2 gap-4">
            <Field label="Época">
              <Input value={draft.year} onChange={(e) => save({ year: e.target.value })} />
            </Field>
            <div className="md:col-span-2 flex items-center gap-3">
              <Checkbox checked={!!draft.isPartial} onCheckedChange={(checked) => save({ isPartial: checked === true })} />
              <span className="text-sm text-muted-foreground">Temporada incompleta</span>
            </div>
            <Field label="Posição final">
              <Input value={draft.finalPosition || ""} onChange={(e) => save({ finalPosition: e.target.value })} placeholder="1º · Vencedor · Subida…" />
            </Field>
            <Field label="Jogos"><NumIn v={draft.matches} on={(v) => save({ matches: v })} /></Field>
            <Field label="Vitórias"><NumIn v={draft.wins} on={(v) => save({ wins: v })} /></Field>
            <Field label="Empates"><NumIn v={draft.draws} on={(v) => save({ draws: v })} /></Field>
            <Field label="Derrotas"><NumIn v={draft.losses} on={(v) => save({ losses: v })} /></Field>
            <Field label="Golos marcados"><NumIn v={draft.goalsFor} on={(v) => save({ goalsFor: v })} /></Field>
            <Field label="Golos sofridos"><NumIn v={draft.goalsAgainst} on={(v) => save({ goalsAgainst: v })} /></Field>
            <div className="md:col-span-2">
              <Field label="Notas">
                <Textarea rows={4} value={draft.notes || ""} onChange={(e) => save({ notes: e.target.value })} />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-between items-center pt-2">
              <Button variant="destructive" size="sm"
                onClick={() => {
                  if (confirm("Apagar temporada?")) {
                    del(season.id); toast.success("Apagada"); location.href = "/seasons";
                  }
                }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Apagar temporada
              </Button>
              <span className="text-xs text-muted-foreground">Auto-guarda ✓</span>
            </div>
          </div>
        </TabsContent>

        {/* COMPETITIONS */}
        <TabsContent value="competitions">
          <div className="card-elevated rounded-2xl p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <div className="text-sm text-muted-foreground">Competições da época</div>
                <div className="text-2xl font-bold">Painel competitivo</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => save({
                competitions: [...draft.competitions, { id: uid(), name: "Nova competição" }],
              })}>
                <Plus className="h-4 w-4 mr-1" /> Nova competição
              </Button>
            </div>

            {draft.competitions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Sem competições registadas ainda. Adiciona a primeira competição para começar.
              </div>
            ) : (
              <div className="space-y-4">
                {draft.competitions.map((c) => (
                  <div key={c.id}
                    className={`rounded-[2rem] border p-5 shadow-sm transition ${c.won ? "border-primary/60 bg-primary/10 shadow-primary/20" : "border-border bg-surface"}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {c.won && (
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                              <Trophy className="h-4 w-4" />
                            </span>
                          )}
                          <div>
                            <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                              {c.won ? "Campeonato" : "Competição"}
                            </div>
                            <Input className="text-lg font-semibold" value={c.name} onChange={(e) => save({
                              competitions: draft.competitions.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x),
                            })} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                          <div className="rounded-full bg-muted/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {c.position || "Posição"}
                          </div>
                          {c.won ? (
                            <div className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs uppercase tracking-[0.18em]">
                              Vencedor
                            </div>
                          ) : c.finalReached ? (
                            <div className="rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs uppercase tracking-[0.18em]">
                              Finalista
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={!!c.won} onChange={(e) => save({
                            competitions: draft.competitions.map((x) => x.id === c.id ? { ...x, won: e.target.checked } : x),
                          })} />
                          Venceu
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={!!c.finalReached} onChange={(e) => save({
                            competitions: draft.competitions.map((x) => x.id === c.id ? { ...x, finalReached: e.target.checked } : x),
                          })} />
                          Final
                        </label>
                        <Button size="icon" variant="ghost" onClick={() => save({
                          competitions: draft.competitions.filter((x) => x.id !== c.id),
                        })}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_0.9fr]">
                      <div>
                        <Label>Notas da competição</Label>
                        <Textarea rows={4} value={c.notes || ""} onChange={(e) => save({
                          competitions: draft.competitions.map((x) => x.id === c.id ? { ...x, notes: e.target.value } : x),
                        })} placeholder="Escreve um resumo de jogos, fase de grupos ou momentos chave." />
                      </div>
                      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-border bg-background p-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</div>
                          <div className="mt-2 text-lg font-semibold">{c.won ? "Vencida" : c.finalReached ? "Final" : "Em curso"}</div>
                        </div>
                        <div className="rounded-3xl bg-muted/70 p-3 text-sm text-muted-foreground">
                          Marca esta competição como vencida ou finalista para destacá-la no painel.
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TRANSFERS */}
        <TabsContent value="transfers">
          <div className="card-elevated rounded-2xl p-6">
            <div className="mb-4 space-y-2">
              <div className="text-sm text-muted-foreground">Fotos e notas de transferências desta época.</div>
              <div className="text-sm">Use a aba Galeria para carregar imagens e marque a categoria como Transferências.</div>
            </div>
            {draft.gallery.filter((g) => g.category === "transfers").length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Sem imagens de transferências. Vai à aba Galeria e adiciona imagens com categoria <strong>Transferências</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {draft.gallery.filter((g) => g.category === "transfers").map((g, idx) => (
                  <div key={g.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={g.src} alt="Transferência" className="h-full w-full object-cover" onClick={() => setLb({ images: draft.gallery.filter((x) => x.category === "transfers").map((x) => x.src), index: idx })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SQUAD */}
        <TabsContent value="squad">
          <div className="card-elevated rounded-2xl p-6">
            <div className="mb-4 space-y-2">
              <div className="text-sm text-muted-foreground">Imagens do plantel e jogadores.</div>
              <div className="text-sm">Use a aba Galeria para carregar imagens e marque a categoria como Plantel.</div>
            </div>
            {draft.gallery.filter((g) => g.category === "squad").length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Sem imagens do plantel. Vai à aba Galeria e adiciona imagens com categoria <strong>Plantel</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {draft.gallery.filter((g) => g.category === "squad").map((g, idx) => (
                  <div key={g.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={g.src} alt="Plantel" className="h-full w-full object-cover" onClick={() => setLb({ images: draft.gallery.filter((x) => x.category === "squad").map((x) => x.src), index: idx })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TACTIC */}
        <TabsContent value="tactic">
          <div className="card-elevated rounded-2xl p-6">
            <div className="mb-4 space-y-2">
              <div className="text-sm text-muted-foreground">Imagens de tática desta época.</div>
              <div className="text-sm">Use a aba Galeria para carregar imagens e marque a categoria como Tática.</div>
            </div>
            {draft.gallery.filter((g) => g.category === "tactic").length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Sem imagens de tática. Vai à aba Galeria e adiciona imagens com categoria <strong>Tática</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {draft.gallery.filter((g) => g.category === "tactic").map((g, idx) => (
                  <div key={g.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={g.src} alt="Tática" className="h-full w-full object-cover" onClick={() => setLb({ images: draft.gallery.filter((x) => x.category === "tactic").map((x) => x.src), index: idx })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* OBJECTIVES */}
        <TabsContent value="objectives">
          <div className="card-elevated rounded-2xl p-6">
            <div className="mb-4 space-y-2">
              <div className="text-sm text-muted-foreground">Imagens de objetivos desta época.</div>
              <div className="text-sm">Use a aba Galeria para carregar imagens e marque a categoria como Objetivos.</div>
            </div>
            {draft.gallery.filter((g) => g.category === "objectives").length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Sem imagens de objetivos. Vai à aba Galeria e adiciona imagens com categoria <strong>Objetivos</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {draft.gallery.filter((g) => g.category === "objectives").map((g, idx) => (
                  <div key={g.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={g.src} alt="Objetivos" className="h-full w-full object-cover" onClick={() => setLb({ images: draft.gallery.filter((x) => x.category === "objectives").map((x) => x.src), index: idx })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* GALLERY */}
        <TabsContent value="gallery">
          <div className="card-elevated rounded-2xl p-6">
            <div className="flex flex-wrap gap-3 mb-4">
              <Button onClick={() => galleryRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1.5" /> Carregar imagens
              </Button>
              <input ref={galleryRef} type="file" multiple accept="image/*" className="hidden"
                onChange={async (e) => {
                  const imgs = await readFilesAsBase64(e.target.files);
                  const newOnes: SeasonGalleryImage[] = imgs.map((src) => ({ id: uid(), src, category: "screenshot" }));
                  save({ gallery: [...draft.gallery, ...newOnes] });
                  toast.success(`${imgs.length} imagens adicionadas`);
                }} />
              <span className="text-xs text-muted-foreground self-center">Drag & drop suportado nas categorias.</span>
            </div>
            {draft.gallery.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Sem imagens. Carrega screenshots do plantel, tática, transferências, objetivos…
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {draft.gallery.map((g, idx) => (
                  <div key={g.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={g.src} alt="" className="h-full w-full object-cover cursor-zoom-in"
                      onClick={() => setLb({ images: draft.gallery.map((x) => x.src), index: idx })} />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition">
                      <Select value={g.category || "other"} onValueChange={(v: any) => save({
                        gallery: draft.gallery.map((x) => x.id === g.id ? { ...x, category: v } : x),
                      })}>
                        <SelectTrigger className="h-7 text-[10px] bg-background/80"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tactic">Tática</SelectItem>
                          <SelectItem value="objectives">Objetivos</SelectItem>
                          <SelectItem value="squad">Plantel</SelectItem>
                          <SelectItem value="transfers">Transferências</SelectItem>
                          <SelectItem value="screenshot">Screenshot</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <button onClick={() => save({ gallery: draft.gallery.filter((x) => x.id !== g.id) })}
                      className="absolute top-2 right-2 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition hover:bg-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* MOMENTS */}
        <TabsContent value="moments">
          <div className="card-elevated rounded-2xl p-6">
            <div className="space-y-3 mb-4">
              {draft.moments.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  Pequenas histórias e momentos marcantes desta temporada.
                </div>
              )}
              {draft.moments.map((m) => (
                <div key={m.id} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex gap-2">
                    <Input value={m.title} onChange={(e) => save({
                      moments: draft.moments.map((x) => x.id === m.id ? { ...x, title: e.target.value } : x),
                    })} placeholder="Título" />
                    <Button variant="ghost" size="icon" onClick={() => save({ moments: draft.moments.filter((x) => x.id !== m.id) })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea rows={3} placeholder="O que aconteceu…" value={m.description || ""}
                    onChange={(e) => save({
                      moments: draft.moments.map((x) => x.id === m.id ? { ...x, description: e.target.value } : x),
                    })} />
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => save({
              moments: [...draft.moments, { id: uid(), title: "Novo momento" }],
            })}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar momento
            </Button>
          </div>
        </TabsContent>

        {/* FILES */}
        <TabsContent value="files">
          <FilesTab draft={draft} save={save} />
        </TabsContent>
      </Tabs>

      {lb && <Lightbox images={lb.images} index={lb.index} onClose={() => setLb(null)} onIndex={() => {}} />}
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border px-4 py-3 backdrop-blur min-w-[80px] text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
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

function NumIn({ v, on }: { v?: number; on: (n: number) => void }) {
  return <Input type="number" value={v ?? ""} onChange={(e) => on(Number(e.target.value) || 0)} />;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function FilesTab({ draft, save }: { draft: Season; save: (p: Partial<Season>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingKind, setPendingKind] = useState<"game" | "save">("save");
  const localFiles = draft.files || [];
  const fileMeta = useArchive((s) => s.data.fileMeta || {});
  const setFileMeta = useArchive((s) => s.setFileMeta);
  const removeFileMeta = useArchive((s) => s.removeFileMeta);
  const [filesLb, setFilesLb] = useState<{ images: string[]; index: number } | null>(null);

  const [cloudFiles, setCloudFiles] = useState<Array<{
    id: string; name: string; mime_type: string | null; size: number; storage_path: string; created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await (supabase.from as any)("season_files")
        .select("*")
        .eq("season_id", draft.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) toast.error("Falha a carregar ficheiros da cloud");
        else setCloudFiles(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [draft.id]);

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const { supabase } = await import("@/integrations/supabase/client");
    for (const f of Array.from(list)) {
      setUploading({ name: f.name, pct: 5 });
      // Simulated progress while supabase-js uploads (no native progress callback)
      const startedAt = Date.now();
      const estimatedMs = Math.max(800, Math.min(20000, (f.size / (300 * 1024)) * 1000));
      const interval = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const pct = Math.min(92, 5 + (elapsed / estimatedMs) * 87);
        setUploading((u) => (u ? { ...u, pct } : u));
      }, 150);
      const path = `${draft.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name}`;
      const { error: upErr } = await supabase.storage
        .from("season-files")
        .upload(path, f, { contentType: f.type || "application/octet-stream", upsert: false });
      clearInterval(interval);
      if (upErr) {
        toast.error(`Falha a carregar ${f.name}: ${upErr.message}`);
        setUploading(null);
        continue;
      }
      setUploading({ name: f.name, pct: 96 });
      const { data: row, error: insErr } = await (supabase.from as any)("season_files")
        .insert({
          season_id: draft.id,
          name: f.name,
          mime_type: f.type || null,
          size: f.size,
          storage_path: path,
        })
        .select()
        .single();
      if (insErr || !row) {
        toast.error(`Metadados de ${f.name} falharam`);
        await supabase.storage.from("season-files").remove([path]);
      } else {
        setUploading({ name: f.name, pct: 100 });
        setCloudFiles((prev) => [row, ...prev]);
        setFileMeta(row.id, { kind: pendingKind, images: [] });
        toast.success(`${f.name} carregado como ${pendingKind === "game" ? "Jogo" : "Save"}`);
      }
      setTimeout(() => setUploading(null), 350);
    }
  };

  const handleAddLink = async () => {
    const raw = linkUrl.trim();
    if (!raw) return toast.error("Indica um URL");
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      return toast.error("URL inválido");
    }
    setSavingLink(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: row, error } = await (supabase.from as any)("season_files")
        .insert({
          season_id: draft.id,
          name: linkName.trim() || url,
          mime_type: "link",
          size: 0,
          storage_path: url,
        })
        .select()
        .single();
      if (error || !row) {
        toast.error("Falha a guardar link");
      } else {
        setCloudFiles((prev) => [row, ...prev]);
        setFileMeta(row.id, { kind: pendingKind, images: [] });
        toast.success(`Link adicionado como ${pendingKind === "game" ? "Jogo" : "Save"}`);
        setLinkUrl("");
        setLinkName("");
        setShowLink(false);
      }
    } finally {
      setSavingLink(false);
    }
  };



  const downloadCloud = async (f: { name: string; storage_path: string }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.storage
      .from("season-files")
      .createSignedUrl(f.storage_path, 60 * 10, { download: f.name });
    if (error || !data) return toast.error("Falha a gerar link de download");
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const removeCloud = async (f: { id: string; storage_path: string }) => {
    if (!confirm("Apagar este ficheiro?")) return;
    const { supabase } = await import("@/integrations/supabase/client");
    const meta = fileMeta[f.id];
    const allPaths = [f.storage_path, ...(meta?.images.map((i) => i.path) || [])];
    await supabase.storage.from("season-files").remove(allPaths);
    const { error } = await (supabase.from as any)("season_files").delete().eq("id", f.id);
    if (error) return toast.error("Falha a apagar");
    setCloudFiles((prev) => prev.filter((x) => x.id !== f.id));
    removeFileMeta(f.id);
    toast.success("Ficheiro apagado");
  };

  const downloadLocal = (f: import("@/lib/types").SeasonFile) => {
    const a = document.createElement("a");
    a.href = f.dataUrl;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const removeLocal = (id: string) => {
    if (!confirm("Apagar este ficheiro local?")) return;
    save({ files: localFiles.filter((x) => x.id !== id) });
    toast.success("Ficheiro local apagado");
  };

  return (
    <div className="card-elevated rounded-2xl p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2">Tipo do próximo upload:</span>
        <Button
          type="button"
          size="sm"
          variant={pendingKind === "save" ? "default" : "outline"}
          onClick={() => setPendingKind("save")}
        >
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant={pendingKind === "game" ? "default" : "outline"}
          onClick={() => setPendingKind("game")}
        >
          Jogo
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-muted/20 p-8 text-center transition mb-6"
      >
        <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <div className="text-sm font-medium">
          Carregar ficheiros como <strong className="text-primary">{pendingKind === "game" ? "Jogo" : "Save"}</strong>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Arrasta para aqui ou clica para escolher. Saves do FM, vídeos do jogo, etc.
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" /> Escolher ficheiros
        </Button>
      </div>

      <div className="mb-6">
        {!showLink ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowLink(true)}
          >
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Adicionar link
          </Button>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              Novo link como <strong className="text-primary">{pendingKind === "game" ? "Jogo" : "Save"}</strong>
            </div>
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                placeholder="https://…"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
              />
              <Input
                placeholder="Nome (opcional)"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void handleAddLink()} disabled={savingLink}>
                  {savingLink ? "A guardar…" : "Guardar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowLink(false); setLinkUrl(""); setLinkName(""); }}>
                  Cancelar
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              YouTube, Twitch VOD, post de blog, partilha externa do save, etc.
            </p>
          </div>
        )}
      </div>


      {uploading && (
        <div className="mb-4 rounded-xl border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="truncate">A carregar <strong>{uploading.name}</strong></span>
            <span className="text-xs text-muted-foreground tabular-nums">{Math.round(uploading.pct)}%</span>
          </div>
          <Progress value={uploading.pct} />
        </div>
      )}


      {/* Cloud files */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Cloud ({cloudFiles.length})
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">A carregar…</div>
        ) : cloudFiles.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">
            <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
            Sem ficheiros na cloud.
          </div>
        ) : (
          <div className="space-y-3">
            {cloudFiles.map((f) => {
              const meta = fileMeta[f.id] || { kind: "save" as const, images: [] };
              return (
                <CloudFileRow
                  key={f.id}
                  file={f}
                  meta={meta}
                  onChangeKind={(k) => setFileMeta(f.id, { ...meta, kind: k })}
                  onAddImages={async (files) => {
                    const { uploadGameImage } = await import("@/lib/season-files");
                    const added: { path: string; name: string }[] = [];
                    for (const img of Array.from(files)) {
                      try {
                        added.push(await uploadGameImage(draft.id, f.id, img));
                      } catch {
                        toast.error(`Falha a carregar ${img.name}`);
                      }
                    }
                    if (added.length) {
                      setFileMeta(f.id, { ...meta, images: [...meta.images, ...added] });
                      toast.success(`${added.length} imagem(ns) adicionada(s)`);
                    }
                  }}
                  onRemoveImage={async (path) => {
                    const { removeStorageObjects } = await import("@/lib/season-files");
                    await removeStorageObjects([path]);
                    setFileMeta(f.id, { ...meta, images: meta.images.filter((i) => i.path !== path) });
                  }}
                  onDownload={() => downloadCloud(f)}
                  onRemove={() => removeCloud(f)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Local fallback files (legacy) */}
      {localFiles.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Locais — fallback ({localFiles.length})
          </div>
          <div className="space-y-2">
            {localFiles
              .slice()
              .sort((a, b) => b.addedAt - a.addedAt)
              .map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(f.size)} · {new Date(f.addedAt).toLocaleDateString()} · local
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadLocal(f)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeLocal(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CloudFileRow({
  file,
  meta,
  onChangeKind,
  onAddImages,
  onRemoveImage,
  onDownload,
  onRemove,
}: {
  file: { id: string; name: string; size: number; created_at: string; storage_path: string; mime_type: string | null };
  meta: import("@/lib/types").CloudFileMeta;
  onChangeKind: (k: "game" | "save") => void;
  onAddImages: (files: FileList) => void | Promise<void>;
  onRemoveImage: (path: string) => void | Promise<void>;
  onDownload: () => void;
  onRemove: () => void;
}) {
  const imageInputId = useId();
  const isLink = file.mime_type === "link" || /^https?:\/\//i.test(file.storage_path);
  return (
    <div className="rounded-xl border border-border bg-surface p-3 hover:border-primary/40 transition">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          {isLink ? <LinkIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-medium">{file.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {isLink
              ? file.storage_path
              : `${formatBytes(file.size)} · ${new Date(file.created_at).toLocaleDateString()}`}
          </div>
        </div>
        <Select value={meta.kind} onValueChange={(v: any) => onChangeKind(v)}>
          <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="save">Save</SelectItem>
            <SelectItem value="game">Jogo</SelectItem>
          </SelectContent>
        </Select>
        {isLink ? (
          <Button size="sm" variant="outline" asChild>
            <a href={file.storage_path} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>


      {meta.kind === "game" && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <input
            id={imageInputId}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const input = e.currentTarget;
              const files = input.files;
              if (files && files.length > 0) {
                const list = Array.from(files);
                const dt = new DataTransfer();
                list.forEach((f) => dt.items.add(f));
                void Promise.resolve(onAddImages(dt.files)).finally(() => {
                  input.value = "";
                });
              } else {
                input.value = "";
              }
            }}
          />
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Imagens do jogo ({meta.images.length})
            </div>
            <Button asChild size="sm" variant="outline">
              <label htmlFor={imageInputId} className="cursor-pointer">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Adicionar imagens
              </label>
            </Button>
          </div>
          {meta.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {meta.images.map((img) => (
                <GameImageThumb key={img.path} path={img.path} onRemove={() => onRemoveImage(img.path)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GameImageThumb({ path, onRemove }: { path: string; onRemove: () => void }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { signedUrl } = await import("@/lib/season-files");
      try {
        const u = await signedUrl(path);
        if (!cancelled) setUrl(u);
      } catch {
        /* noop */
      }
    })();
    return () => { cancelled = true; };
  }, [path]);
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/30">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition hover:bg-destructive"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

