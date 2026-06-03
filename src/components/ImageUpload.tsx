import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function fileToBase64(file: File, maxWidth = 1600): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  // Preserve transparency for PNG/SVG/WebP (logos, badges).
  // Use JPEG only for true photos to keep size down.
  const keepAlpha = /image\/(png|webp|svg\+xml|gif)/i.test(file.type);
  return await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(
        keepAlpha
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", 0.85),
      );
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface Props {
  value?: string;
  onChange: (v: string | undefined) => void;
  label?: string;
  className?: string;
  aspect?: "square" | "video" | "banner";
  rounded?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label = "Carregar imagem",
  className,
  aspect = "square",
  rounded,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    const b64 = await fileToBase64(file);
    onChange(b64);
  };

  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "video"
        ? "aspect-video"
        : "aspect-[3/1]";

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
        onClick={() => ref.current?.click()}
        className={cn(
          "relative cursor-pointer overflow-hidden border-2 border-dashed transition-all",
          rounded ? "rounded-full" : "rounded-xl",
          aspectClass,
          drag
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/60 bg-muted/20",
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 hover:bg-destructive hover:text-destructive-foreground transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">{label}</span>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      {!value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => ref.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-3.5 w-3.5" />
          Escolher ficheiro
        </Button>
      )}
    </div>
  );
}

export async function readFilesAsBase64(files: FileList | null): Promise<string[]> {
  if (!files) return [];
  const out: string[] = [];
  for (const f of Array.from(files)) out.push(await fileToBase64(f));
  return out;
}
