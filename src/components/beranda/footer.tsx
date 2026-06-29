import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f8fafc] border-t border-slate-200">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between px-6 lg:px-10 py-6 gap-4">
        {/* Left - Logo & Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
          <div className="w-8 h-8 rounded-lg bg-[#99BD4A]/10 flex items-center justify-center shrink-0">
            <Image
              src="/icons/icon-ilms-no-fill.png"
              alt="Logo"
              width={18}
              height={18}
              className="object-contain"
            />
          </div>
          <p className="text-sm text-slate-500 leading-snug">
            © 2026 Rumah Kreatif Wadas Kelir. Intelligent Library Management System.
          </p>
        </div>

        {/* Right - Links */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm font-medium text-slate-500">
          <Link
            href="/syarat-ketentuan"
            className="hover:text-[#99BD4A] transition-colors duration-200"
          >
            Syarat & Ketentuan
          </Link>
          <Link
            href="/kebijakan-privasi"
            className="hover:text-[#99BD4A] transition-colors duration-200"
          >
            Kebijakan Privasi
          </Link>
          <Link
            href="/kontak"
            className="hover:text-[#99BD4A] transition-colors duration-200"
          >
            Kontak Kami
          </Link>
        </div>
      </div>
    </footer>
  );
}
