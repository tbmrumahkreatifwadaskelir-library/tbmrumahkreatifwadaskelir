export default function KatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      {children}
    </div>
  );
}
