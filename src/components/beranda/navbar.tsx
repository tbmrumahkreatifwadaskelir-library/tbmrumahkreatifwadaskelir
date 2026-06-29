"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, User, Loader2, BookOpen } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useGetNotificationsQuery } from "@/services/notification.service";
import type { BookData } from "@/components/katalog/koleksi-card";
import { useListBooksQuery } from "@/services/books.service";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/katalog", label: "Katalog" },
  { href: "/pinjaman", label: "Pinjaman" },
  { href: "/kegiatan", label: "Kegiatan" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentFrom = "beranda";
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: searchDataRes, isFetching: isSearching } = useListBooksQuery(
    { search: debouncedQuery, per_page: 5 },
    { skip: !debouncedQuery.trim() }
  );

  let searchResults: BookData[] = [];
  if (searchDataRes?.data) {
    const resData = searchDataRes.data as Record<string, unknown> | BookData[];
    if (Array.isArray(resData)) {
      searchResults = resData;
    } else if (resData && typeof resData === "object") {
      if ("books" in resData && Array.isArray(resData.books)) {
        searchResults = resData.books as BookData[];
      } else if ("data" in resData && Array.isArray(resData.data)) {
        searchResults = resData.data as BookData[];
      }
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  const { data: notificationsDataRes } = useGetNotificationsQuery({ page: 1, paginate: 10 });
  const hasUnread = (notificationsDataRes?.unread_count && notificationsDataRes.unread_count > 0) || false;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/icons/icon-ilms-no-fill.png"
            alt="Logo Wadas Kelir"
            width={28}
            height={28}
            className="object-contain"
          />
          <span className="font-extrabold text-[#1e293b] text-lg tracking-tight">
            Wadas Kelir
          </span>
        </Link>

        {/* Search Bar */}
        <div 
          className="hidden md:flex items-center mx-6 lg:mx-10 flex-1 max-w-md relative"
          ref={dropdownRef}
        >
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari buku, penulis, atau genre..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f1f5f9] rounded-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#99BD4A]/30 focus:bg-white transition-all duration-200"
            />
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && searchQuery.trim() !== "" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 flex flex-col max-h-[400px]">
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hasil Pencarian
                </span>
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 text-[#99BD4A] animate-spin" />
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {!isSearching && searchResults.length === 0 ? (
                  <div className="py-8 px-4 text-center flex flex-col items-center">
                    <BookOpen className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm font-medium text-slate-500">
                      Tidak ada buku yang ditemukan
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba kata kunci lain
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {searchResults.map((book) => (
                      <Link
                        key={book.id || book.biblio_id}
                        href={`/detail-katalog/${book.id || book.biblio_id}?from=${currentFrom}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-10 h-14 bg-slate-100 rounded-lg shrink-0 overflow-hidden relative">
                          {book.image ? (
                            <Image
                              src={
                                book.image.startsWith("http") ||
                                book.image.startsWith("/")
                                  ? book.image
                                  : `https://slims.web.id/web/${book.image}`
                              }
                              alt={book.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#f4f7ee]">
                              <BookOpen className="w-4 h-4 text-[#99BD4A]/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h4 className="text-[13px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#99BD4A] transition-colors">
                            {book.title}
                          </h4>
                          <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5">
                            {book.author}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                              {book.classification || "Umum"}
                            </span>
                            {book.availability?.toLowerCase() === "available" ||
                            book.availability === "1" ||
                            book.availability === "Tersedia" ||
                            !book.availability ? (
                              <span className="text-[10px] font-semibold text-[#99BD4A]">
                                Tersedia
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400">
                                Dipinjam
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="p-2 border-t border-slate-50 bg-white">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push(`/katalog`);
                    }}
                    className="w-full py-2 text-xs font-bold text-[#99BD4A] hover:bg-[#f4f7ee] rounded-lg transition-colors text-center"
                  >
                    Lihat di Katalog Pintar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-[#99BD4A] bg-[#99BD4A]/8"
                    : "text-[#475569] hover:text-[#99BD4A] hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3 ml-4">
          <Link
            href="/notifikasi"
            className="relative p-2.5 rounded-full hover:bg-slate-100 transition-colors duration-200 group"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-slate-500 group-hover:text-[#99BD4A] transition-colors" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </Link>

          <button className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#B4D568] to-[#99BD4A] flex items-center justify-center ring-2 ring-[#99BD4A]/20 hover:ring-[#99BD4A]/40 transition-all duration-200 overflow-hidden">
            <User size={18} color="white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
