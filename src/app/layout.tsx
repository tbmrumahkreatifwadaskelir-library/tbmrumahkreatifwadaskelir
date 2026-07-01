import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ActiveThemeProvider } from "@/components/active-theme";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { fontVariables } from "@/lib/fonts";
import ReduxProvider from "@/providers/redux";
import { ProgressBarProvider } from "@/components/progress-bar-provider";

// export const META_THEME_COLORS = {
//   light: "#ffffff",
//   dark: "#09090b",
// };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "Rumah Kreatif Wadas Kelir - Taman Bacaan Masyarakat",
    template: "%s | Rumah Kreatif Wadas Kelir",
  },
  description:
    "Solusi manajemen Taman Bacaan Masyarakat (TBM) modern untuk mendukung operasional dan aksesibilitas buku di Rumah Kreatif Wadas Kelir.",
  keywords: ["Taman Bacaan Masyarakat", "TBM", "Rumah Kreatif Wadas Kelir", "Perpustakaan", "Buku", "Literasi"],
  authors: [{ name: "Rumah Kreatif Wadas Kelir" }],
  creator: "Rumah Kreatif Wadas Kelir",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    title: "Rumah Kreatif Wadas Kelir - Taman Bacaan Masyarakat",
    description: "Solusi manajemen Taman Bacaan Masyarakat (TBM) modern untuk mendukung operasional dan aksesibilitas buku di Rumah Kreatif Wadas Kelir.",
    siteName: "Rumah Kreatif Wadas Kelir",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rumah Kreatif Wadas Kelir - Taman Bacaan Masyarakat",
    description: "Solusi manajemen Taman Bacaan Masyarakat (TBM) modern untuk mendukung operasional dan aksesibilitas buku di Rumah Kreatif Wadas Kelir.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : "",
          fontVariables
        )}
      >
        <ReduxProvider>
          <ProgressBarProvider />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange
          >
            <ActiveThemeProvider>{children}</ActiveThemeProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
