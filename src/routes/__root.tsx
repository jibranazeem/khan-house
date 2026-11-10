import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, useLocation, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CartSheet } from "@/components/site/CartSheet";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";
import { track } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-ink px-4 pt-24 text-white">
      <div className="max-w-md text-center">
        <p className="font-display text-9xl text-fire-gradient">404</p>
        <h1 className="mt-2 font-display text-4xl tracking-wide">This plate's not on the menu</h1>
        <p className="mt-2 text-sm text-white/60">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-fire px-6 py-3 text-sm font-bold uppercase tracking-wider text-white">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 pt-24">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl tracking-wide">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Check your connection and try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-fire px-5 py-2.5 text-sm font-bold text-white">Try again</button>
          <a href="/" className="rounded-full border border-input px-5 py-2.5 text-sm font-bold">Go home</a>
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
      { title: `${BRAND.name} — Halal Hibachi & Mediterranean in ${BRAND.area}` },
      { name: "description", content: `${BRAND.name}: 100% halal hibachi and Mediterranean fusion in ${BRAND.area}. Chicken over rice, lamb gyros, hibachi chicken & shrimp. Order online for pickup or delivery.` },
      { name: "theme-color", content: "#141110" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: BRAND.name },
      { property: "og:image", content: "/images/hero/mixed-grill.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const LOCAL_BUSINESS = JSON.stringify({
  "@context": "https://schema.org", "@type": "Restaurant", name: BRAND.name, telephone: "+1-919-307-9893",
  servesCuisine: ["Mediterranean", "Hibachi", "Halal"], hasMap: BRAND.mapsUrl,
  address: { "@type": "PostalAddress", streetAddress: BRAND.street, addressLocality: "Apex", addressRegion: "NC", postalCode: "27502", addressCountry: "US" },
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LOCAL_BUSINESS }} /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => { if (!isAdmin) track.visit(); }, [isAdmin]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {isAdmin ? <Outlet /> : (
          <>
            <SiteHeader />
            <main className="min-h-[60vh]"><Outlet /></main>
            <SiteFooter />
            <CartSheet />
          </>
        )}
        <Toaster position="top-center" richColors />
      </CartProvider>
    </QueryClientProvider>
  );
}
