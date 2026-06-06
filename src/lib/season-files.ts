import { supabase } from "@/integrations/supabase/client";

export interface CloudSeasonFile {
  id: string;
  season_id: string;
  name: string;
  mime_type: string | null;
  size: number;
  storage_path: string;
  created_at: string;
}

export function isLinkFile(f: { storage_path: string; mime_type?: string | null }) {
  return (f.mime_type === "link") || /^https?:\/\//i.test(f.storage_path);
}

export function openLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function fetchAllSeasonFiles(): Promise<CloudSeasonFile[]> {
  const { data, error } = await (supabase.from as any)("season_files")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as CloudSeasonFile[];
}

export async function signedUrl(path: string, downloadName?: string) {
  const { data, error } = await supabase.storage
    .from("season-files")
    .createSignedUrl(path, 60 * 30, downloadName ? { download: downloadName } : undefined);
  if (error || !data) throw error || new Error("no signed url");
  return data.signedUrl;
}

export async function downloadFile(path: string, name: string) {
  const url = await signedUrl(path, name);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function uploadGameImage(seasonId: string, fileId: string, file: File) {
  const path = `${seasonId}/game-images/${fileId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${file.name}`;
  const { error } = await supabase.storage
    .from("season-files")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw error;
  return { path, name: file.name };
}

export async function removeStorageObjects(paths: string[]) {
  if (paths.length === 0) return;
  await supabase.storage.from("season-files").remove(paths);
}

export async function deleteSeasonFile(
  file: { id: string; storage_path: string; mime_type?: string | null },
  imagePaths: string[] = [],
) {
  const paths = [
    ...(isLinkFile(file) ? [] : [file.storage_path]),
    ...imagePaths,
  ];
  if (paths.length) await supabase.storage.from("season-files").remove(paths);
  const { error } = await (supabase.from as any)("season_files").delete().eq("id", file.id);
  if (error) throw error;
}

export async function fetchTotalUsedBytes(): Promise<number> {
  const { data, error } = await (supabase.from as any)("season_files").select("size");
  if (error) throw error;
  return ((data || []) as { size: number }[]).reduce((a, r) => a + (r.size || 0), 0);
}

