import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, useState } from "react";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download } from "lucide-react";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Essa página não existe ou foi movida.</p>
        <div className="mt-6">
          <Link to="/loja" className="inline-flex items-center justify-center rounded-full bg-primary-gradient px-5 py-2 text-sm font-medium text-primary-foreground shadow-elegant">
            Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente ou volte à loja.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar de novo
          </button>
          <a href="/loja" className="rounded-full border border-input px-4 py-2 text-sm font-medium">Início</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KL Açaí — Açaí premium na garrafinha" },
      { name: "description", content: "Peça seu açaí na garrafinha 300ml ou 500ml com entrega rápida. Sabores variados e cremosos." },
      { property: "og:title", content: "KL Açaí — Açaí premium na garrafinha" },
      { property: "og:description", content: "Peça seu açaí na garrafinha 300ml ou 500ml com entrega rápida. Sabores variados e cremosos." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "KL Açaí — Açaí premium na garrafinha" },
      { name: "twitter:description", content: "Peça seu açaí na garrafinha 300ml ou 500ml com entrega rápida. Sabores variados e cremosos." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/05860fe7-a0d6-4c9a-980f-744c0babb8c4/id-preview-e4d7e2d7--864eb156-1445-4625-b4d6-9e52b053c307.lovable.app-1780424244718.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/05860fe7-a0d6-4c9a-980f-744c0babb8c4/id-preview-e4d7e2d7--864eb156-1445-4625-b4d6-9e52b053c307.lovable.app-1780424244718.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
        {deferredPrompt && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handleInstall}
              className="bg-primary-gradient text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Download className="h-5 w-5" /> Instalar Aplicativo KL Admin
            </button>
          </div>
        )}
      </CartProvider>
    </QueryClientProvider>
  );
}
