import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/season-files";

export function useSignedUrl(path?: string) {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(undefined);
      return;
    }
    signedUrl(path)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);
  return url;
}
