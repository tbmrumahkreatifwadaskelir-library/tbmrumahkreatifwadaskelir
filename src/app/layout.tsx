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
  title: "RKWK - Taman Bacaan Masyarakat",
  description:
    "Solusi manajemen Taman Bacaan Masyarakat (TBM) modern untuk mendukung operasional dan aksesibilitas buku di Rumah Kreatif Wadas Kelir.",
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
