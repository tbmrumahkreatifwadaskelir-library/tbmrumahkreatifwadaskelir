import Navbar from "@/components/main/navbar";
import Footer from "@/components/main/footer";
import SplashScreen from "@/components/beranda/splash-screen";

export default function BerandaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SplashScreen />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
