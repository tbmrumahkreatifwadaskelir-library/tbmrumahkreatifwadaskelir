"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Library, BookX, ChevronLeft, ChevronRight } from "lucide-react";
import KoleksiCard, { BookData } from "./koleksi-card";
import { Input } from "@/components/ui/input";
import { useRecommendedBooksQuery, useListBooksQuery } from "@/services/books.service";
import { useBooksByDdcQuery } from "@/services/ddc.service";

interface KatalogViewProps {
  selectedCategory: string;
}

export default function KatalogView({ selectedCategory }: KatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"populer" | "terbaru" | "rekomendasi">("populer");
  const [page, setPage] = useState(1);
  const limit = 9;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  // Queries
  const isRecommended = activeTab === "rekomendasi";
  const sortParam = activeTab === "populer" ? "popular" : activeTab === "terbaru" ? "latest" : undefined;

  const isAll = selectedCategory === "semua";

  const {
    data: allBooksDataRes,
    isLoading: isAllBooksLoading,
    isError: isAllBooksError,
    error: allBooksErrorObj,
    refetch: refetchAllBooks
  } = useListBooksQuery(
    {
      page,
      per_page: limit,
      search: debouncedSearch,
      sort: sortParam,
    },
    { skip: isRecommended || !isAll }
  );

  const {
    data: listDataRes,
    isLoading: isListLoading,
    isError: isListError,
    error: listErrorObj,
    refetch: refetchList
  } = useBooksByDdcQuery(
    {
      code: selectedCategory,
      page,
      per_page: limit,
      search: debouncedSearch,
      sort: sortParam,
    },
    { skip: isRecommended || isAll }
  );

  const {
    data: recDataRes,
    isLoading: isRecLoading,
    isError: isRecError,
    refetch: refetchRec
  } = useRecommendedBooksQuery(undefined, { skip: !isRecommended });

  const loading = isRecommended ? isRecLoading : isAll ? isAllBooksLoading : isListLoading;
  const isError = isRecommended ? isRecError : isAll ? isAllBooksError : isListError;
  const listErrorToUse = isAll ? allBooksErrorObj : listErrorObj;
  
  // Jika backend mengembalikan 404 (kategori DDC belum ada bukunya), jangan tampilkan sebagai error sistem
  const is404 = !isRecommended && isError && listErrorToUse && (listErrorToUse as { status?: number }).status === 404;
  const error = (isError && !is404) ? "Gagal memuat data koleksi dari server. Pastikan koneksi stabil atau coba lagi nanti." : null;

  // Extract data based on active tab
  let data: BookData[] = [];
  let totalBooks = 0;
  let totalPages = 1;

  if (isRecommended) {
    if (recDataRes?.data && Array.isArray(recDataRes.data)) {
      data = recDataRes.data;
      totalBooks = data.length;
      totalPages = 1; // Rekomendasi biasanya tidak dipaginasi
    }
  } else {
    const res = isAll ? allBooksDataRes : listDataRes;
    if (res?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resData = res.data as any;
      
      // Handle DDC API structure: { books: [], pagination: {} }
      if ("books" in resData && Array.isArray(resData.books)) {
        data = resData.books;
        totalBooks = resData.pagination?.total ?? resData.books.length;
        totalPages = resData.pagination?.last_page ?? Math.ceil(totalBooks / limit);
      } 
      // Handle laravel standard pagination structure: { data: [], total: ... }
      else if ("data" in resData && Array.isArray(resData.data)) {
        data = resData.data;
        totalBooks = resData.total ?? resData.data.length;
        totalPages = resData.last_page ?? Math.ceil(totalBooks / limit);
      } 
      // Handle direct array
      else if (Array.isArray(resData)) {
        data = resData;
        totalBooks = resData.length;
        totalPages = Math.ceil(resData.length / limit);
      }
    }
  }

  const handleRetry = () => {
    if (isRecommended) refetchRec();
    else if (isAll) refetchAllBooks();
    else refetchList();
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const tabs = [
    { key: "populer" as const, label: "Populer" },
    { key: "terbaru" as const, label: "Terbaru" },
    { key: "rekomendasi" as const, label: "Rekomendasi" },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 py-6 md:py-8 px-4 md:px-8 lg:px-10 overflow-y-auto">
      {/* Search Bar */}
      <div className="relative max-w-6xl mx-auto w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Cari buku kesukaan anda...."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-5 h-13 bg-white border-slate-200 rounded-2xl text-[15px] shadow-sm focus-visible:ring-[#99BD4A] focus-visible:border-[#99BD4A]"
        />
      </div>

      {/* Tabs & Book Count */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-[#99BD4A] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Menampilkan{" "}
          <span className="font-bold text-[#99BD4A]">{totalBooks}</span> buku
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 text-[#99BD4A] animate-spin mb-4" />
          <p className="text-slate-500 font-medium">
            Memuat katalog koleksi...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-red-50/50 rounded-2xl border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <BookX className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-slate-600 text-center max-w-md mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2.5 bg-[#99BD4A] hover:bg-[#8aac3d] text-white rounded-xl font-semibold transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Library className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Koleksi Tidak Ditemukan
          </h3>
          <p className="text-slate-500 text-center">
            Coba gunakan kata kunci pencarian atau filter yang berbeda.
          </p>
        </div>
      ) : (
        <>
          {/* Book Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((item, index) => (
              <KoleksiCard key={item.id || item.biblio_id || index} biblio={item} />
            ))}
          </div>

          {/* Pagination (Hanya tampil jika bukan rekomendasi atau page > 1) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPaginationNumbers().map((p, i) =>
                p === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="w-9 h-9 flex items-center justify-center text-sm text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                      page === p
                        ? "bg-[#99BD4A] text-white shadow-sm"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
