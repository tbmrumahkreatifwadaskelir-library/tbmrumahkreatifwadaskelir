"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import berandaData from "@/json/beranda.json";
import Link from "next/link";
import { useRecommendedBooksQuery, useToggleFavoriteBookMutation, useGetFavoriteBooksQuery } from "@/services/books.service";

interface RecommendedBook {
  id: number;
  title: string;
  author: string;
  matchPercent: number;
  coverGradient: string;
  titleOnCover: string;
  image?: string | null;
}

function BookCard({ book, isFavorite, onToggle }: { book: RecommendedBook, isFavorite: boolean, onToggle: (id: string | number) => void }) {

  return (
    <Link href={`/detail-katalog/${book.id}?from=beranda`} className="flex-shrink-0 w-[180px] group cursor-pointer block">
      {/* Cover */}
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {book.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.image}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: book.coverGradient }}
            />

            {/* Cover texture */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
            </div>

            {/* Cover text */}
            {book.titleOnCover && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-white/70 text-[10px] font-bold text-center leading-relaxed tracking-wider whitespace-pre-line uppercase">
                  {book.titleOnCover}
                </p>
              </div>
            )}
          </>
        )}

        {/* Spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/10" />

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(book.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"
            }`}
          />
        </button>

        {/* Match badge */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-[#99BD4A] text-white text-[11px] font-bold shadow-lg">
            Match {book.matchPercent}%
          </span>
        </div>
      </div>

      {/* Book info */}
      <div className="mt-3 px-0.5">
        <h3 className="font-bold text-sm text-[#1e293b] group-hover:text-[#99BD4A] transition-colors truncate">
          {book.title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{book.author}</p>
      </div>
    </Link>
  );
}

export default function RekomendasiBuku() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: recommendedRes } = useRecommendedBooksQuery();
  const { data: favoritesRes } = useGetFavoriteBooksQuery({ per_page: 100 });
  const [toggleFavorite] = useToggleFavoriteBookMutation();
  const [books, setBooks] = useState<RecommendedBook[]>(berandaData.recommendedBooks);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const favoriteBooks = ((favoritesRes?.data as any)?.data || (favoritesRes?.data as any)?.books || (favoritesRes?.data as any) || []) as any[];
  const favoriteIds = new Set(favoriteBooks.map(b => b.id.toString()));

  const handleToggle = async (id: string | number) => {
    try {
      await toggleFavorite(id).unwrap();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recommendedBooks = (recommendedRes?.data as any) || (recommendedRes as any)?.data?.data;

    if (recommendedBooks && Array.isArray(recommendedBooks) && recommendedBooks.length > 0) {
      const gradients = [
        "linear-gradient(135deg, #426152 0%, #385444 100%)",
        "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)",
        "linear-gradient(135deg, #2B6CB0 0%, #2C5282 100%)",
        "linear-gradient(135deg, #805AD5 0%, #553C9A 100%)",
        "linear-gradient(135deg, #C53030 0%, #9B2C2C 100%)",
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = recommendedBooks.map((book: any, idx: number) => ({
        id: book.id || 0,
        title: book.title || "",
        author: book.author || book.writer || "Unknown Author",
        matchPercent: book.match_percent || (98 - idx * 2),
        coverGradient: book.cover_gradient || gradients[idx % gradients.length],
        titleOnCover: !book.cover_url ? (book.title || "") : "",
        image: book.cover_url || null,
      }));
      setBooks(mapped);
    }
  }, [recommendedRes]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -220 : 220;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-[#1e293b]">
            Rekomendasi Cerdas Untukmu
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#99BD4A]/10 text-[#99BD4A] text-xs font-bold whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" />
            AI POWERED
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pt-2 pb-4 px-2 -mx-2 scroll-smooth"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            isFavorite={favoriteIds.has(book.id.toString())}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </section>
  );
}
