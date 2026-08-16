import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Actra — Turn information into action" },
      { name: "description", content: "Actra is an action intelligence platform that turns notices and circulars into ranked, deadline-aware actions." },
      { name: "author", content: "Actra" },
      { property: "og:title", content: "Actra — Turn information into action" },
      { property: "og:description", content: "Actra turns notices and circulars into ranked, deadline-aware actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Actra — Turn information into action" },
      { name: "twitter:description", content: "Actra turns notices and circulars into ranked, deadline-aware actions." },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="pb-[env(safe-area-inset-bottom)]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <div className="animate-page-enter">
        <Outlet />
      </div>
      <Toaster position="top-center" />
    </>
  );
}
