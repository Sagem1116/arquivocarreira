import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar, MobileNav } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { useArchive } from "@/lib/store";
import { applyClubTheme, resetTheme } from "@/lib/theme";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <p className="mt-4 text-muted-foreground">Página não encontrada.</p>
        <a href="/" className="mt-6 inline-block text-primary underline">
          Voltar
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo correu mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FM Career Archive" },
      { name: "description", content: "Arquivo interativo da tua carreira de treinador no Football Manager." },
      { property: "og:title", content: "FM Career Archive" },
      { name: "twitter:title", content: "FM Career Archive" },
      { property: "og:description", content: "Arquivo interativo da tua carreira de treinador no Football Manager." },
      { name: "twitter:description", content: "Arquivo interativo da tua carreira de treinador no Football Manager." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fd6f1ee8-cd17-40a8-8657-7095289a00ee/id-preview-94babb66--90039044-c033-42ac-9c86-6210ad088d33.lovable.app-1778799467939.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fd6f1ee8-cd17-40a8-8657-7095289a00ee/id-preview-94babb66--90039044-c033-42ac-9c86-6210ad088d33.lovable.app-1778799467939.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeWatcher() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const clubs = useArchive((s) => s.data.clubs);
  const seasons = useArchive((s) => s.data.seasons);

  useEffect(() => {
    // /clubs/:id and /seasons/:id apply club color
    const clubMatch = path.match(/^\/clubs\/([^/]+)/);
    const seasonMatch = path.match(/^\/seasons\/([^/]+)/);
    if (clubMatch) {
      const c = clubs.find((x) => x.id === clubMatch[1]);
      if (c) return applyClubTheme(c.color);
    }
    if (seasonMatch) {
      const s = seasons.find((x) => x.id === seasonMatch[1]);
      const c = s && clubs.find((x) => x.id === s.clubId);
      if (c) return applyClubTheme(c.color);
    }
    resetTheme();
  }, [path, clubs, seasons]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hydrate = useArchive((s) => s.hydrate);
  const hydrated = useArchive((s) => s.hydrated);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeWatcher />
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          {hydrated && <TopBar />}
          <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-24 md:pb-10 scrollbar-thin transition-colors duration-300 ease-out">
            <div key={path} className="animate-content-fade">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
      <Toaster theme="dark" richColors position="top-right" />
    </QueryClientProvider>
  );
}
