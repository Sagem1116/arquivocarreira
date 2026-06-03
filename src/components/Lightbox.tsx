import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const [i, setI] = useState(index);
  useEffect(() => setI(index), [index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft") setI((p) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);
  useEffect(() => onIndex(i), [i, onIndex]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-background/40 p-2 hover:bg-background/80"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={() => setI((p) => (p - 1 + images.length) % images.length)}
        className="absolute left-4 rounded-full bg-background/40 p-3 hover:bg-background/80"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <img
        src={images[i]}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
      />
      <button
        onClick={() => setI((p) => (p + 1) % images.length)}
        className="absolute right-4 rounded-full bg-background/40 p-3 hover:bg-background/80"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-4 text-xs text-muted-foreground">
        {i + 1} / {images.length}
      </div>
    </div>
  );
}
