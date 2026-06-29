"use client";

import {
  BookOpen,
  Brain,
  Church,
  Users,
  Languages,
  FlaskConical,
  Cpu,
  Palette,
  BookText,
  Globe,
  X,
  User,
  Loader2,
} from "lucide-react";
import { useListMainClassesQuery } from "@/services/ddc.service";

const ddcIconMap: Record<string, React.ElementType> = {
  semua: BookOpen,
  "000": BookOpen,
  "100": Brain,
  "200": Church,
  "300": Users,
  "400": Languages,
  "500": FlaskConical,
  "600": Cpu,
  "700": Palette,
  "800": BookText,
  "900": Globe,
};

// Fallback jika API gagal
const fallbackCategories = [
  { code: "semua", label: "Semua Klasifikasi" },
  { code: "000", label: "Karya Umum" },
  { code: "100", label: "Filsafat & Psikologi" },
  { code: "200", label: "Agama" },
  { code: "300", label: "Ilmu Sosial" },
  { code: "400", label: "Bahasa" },
  { code: "500", label: "Sains & Matematika" },
  { code: "600", label: "Teknologi" },
  { code: "700", label: "Kesenian & Olahraga" },
  { code: "800", label: "Sastra" },
  { code: "900", label: "Sejarah & Geografi" },
];

interface KatalogSidebarProps {
  selectedCategory: string;
  onCategoryChange: (code: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export default function KatalogSidebar({
  selectedCategory,
  onCategoryChange,
  isOpen = false,
  setIsOpen,
}: KatalogSidebarProps) {
  const { data: ddcRes, isLoading } = useListMainClassesQuery();
  
  // Ambil dari API jika ada, jika tidak gunakan fallback
  const ddcCategories = (ddcRes?.data && Array.isArray(ddcRes.data)) 
    ? [{ code: "semua", class_name: "Semua Klasifikasi" }, ...ddcRes.data] 
    : fallbackCategories;

  return (
    <aside 
      className={`fixed lg:sticky top-0 left-0 z-[60] lg:z-40 w-[280px] h-screen bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#99BD4A]/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#99BD4A]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-[16px] leading-tight">
              Katalog Pintar
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem Perpustakaan DDC
            </p>
          </div>
        </div>
        {setIsOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* DDC Categories */}
      <div className="flex-1 px-4 pb-6">
        <p className="text-[11px] font-bold text-[#99BD4A]/70 tracking-widest uppercase px-3 mb-3 flex items-center justify-between">
          <span>Klasifikasi DDC</span>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-[#99BD4A]" />}
        </p>
        <nav className="space-y-0.5">
          {ddcCategories.map((cat: { code?: string; class_code?: string; label?: string; name?: string; class_name?: string }) => {
            // Mapping icon based on code (e.g. "000")
            const code = cat.code || cat.class_code || "";
            const Icon = ddcIconMap[code] || BookOpen;
            const label = cat.label || cat.name || cat.class_name || "";
            const isActive = selectedCategory === code;

            if (!code) return null;

            return (
              <button
                key={code}
                onClick={() => onCategoryChange(code)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-[#99BD4A]/10 text-[#99BD4A] font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive
                      ? "text-[#99BD4A]"
                      : "text-slate-400 group-hover:text-slate-500"
                  }`}
                />
                <span className="truncate">
                  {code !== "semua" ? `${code} ` : ""}{label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info at Bottom */}
      <div className="p-5 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B4D568] to-[#99BD4A] flex items-center justify-center overflow-hidden ring-2 ring-[#99BD4A]/20">
            <User size={18} color="white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              Anggota Wadas
            </p>
            <p className="text-xs text-[#99BD4A] font-medium">ID: WK-2026</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
