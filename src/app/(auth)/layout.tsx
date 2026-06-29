export const metadata = {
  title: "RKWK - Taman Bacaan Masyarakat",
  description:
    "Solusi manajemen Taman Bacaan Masyarakat (TBM) modern untuk mendukung operasional dan aksesibilitas buku di Rumah Kreatif Wadas Kelir.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="relative min-h-screen bg-white text-black"
        suppressHydrationWarning
      >
        <main className="flex items-center justify-center min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
