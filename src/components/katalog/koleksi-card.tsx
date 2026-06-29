import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Star, Book, Heart } from "lucide-react";
import { useGetFavoriteBooksQuery, useToggleFavoriteBookMutation } from "@/services/books.service";

export interface BookData {
  id?: string | number;
  biblio_id?: string | number;
  title: string;
  author: string;
  writer?: string;
  publish_year?: string | number;
  image?: string;
  cover_image?: string;
  cover_url?: string;
  availability?: string;
  total_copies?: number;
  isbn_issn?: string;
  publisher?: string;
  classification?: string;
  ddc_code?: string;
  call_number?: string;
  notes?: string;
  description?: string;
  collection_type?: string;
  book_type?: string;
  rating?: number;
  total_review?: number;
}

interface KoleksiCardProps {
  biblio: BookData;
}

export default function KoleksiCard({ biblio }: KoleksiCardProps) {
  const pathname = usePathname();
  const currentFrom = pathname === "/" ? "beranda" : pathname.split("/")[1] || "katalog";

  const rawImage = biblio.cover_url || biblio.cover_image || biblio.image;
  let imageUrl = rawImage && rawImage !== "" ? rawImage : null;
  if (imageUrl && !imageUrl.startsWith("http") && !imageUrl.startsWith("/images") && !imageUrl.startsWith("data:")) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
    imageUrl = `${baseUrl}/${imageUrl.replace(/^\//, '')}`;
  }

  const { data: favoritesRes } = useGetFavoriteBooksQuery({ per_page: 100 });
  const [toggleFavorite] = useToggleFavoriteBookMutation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const favoriteBooks = ((favoritesRes?.data as any)?.data || (favoritesRes?.data as any)?.books || (favoritesRes?.data as any) || []) as any[];
  const bookId = biblio.id || biblio.biblio_id;
  const isFavorite = favoriteBooks.some(b => b.id.toString() === bookId?.toString());

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!bookId) return;
    try {
      await toggleFavorite(bookId).unwrap();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Determine availability based on new property (total_copies) or old one
  const isAvailable =
    biblio.book_type === "digital" ||
    (biblio.total_copies !== undefined && biblio.total_copies > 0) ||
    biblio.availability?.toLowerCase() === "available" ||
    biblio.availability === "1" ||
    biblio.availability === "Tersedia" ||
    (!biblio.availability && biblio.total_copies === undefined);

  const rating = biblio.rating !== undefined ? Number(biblio.rating).toFixed(1) : "0.0";
  const reviewCount =
    biblio.total_review !== undefined ? biblio.total_review : 0;

  const author = biblio.author || biblio.writer || "Pengarang Tidak Diketahui";

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#99BD4A]/30 transition-all duration-300 flex flex-col h-full p-4">
      {/* Cover Image */}
      <Link
        href={`/detail-katalog/${bookId}?from=${currentFrom}`}
        className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#f6f5ef] flex items-center justify-center cursor-pointer mb-4 shrink-0"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={biblio.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book size={56} color="#cbd5e1" strokeWidth={1.2} />
          </div>
        )}

        {/* Actions Container */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
          {/* Wishlist button */}
          <button
            onClick={handleToggleFavorite}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"
              }`}
            />
          </button>
          
          {/* Availability Badge */}
          <Badge
            className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 border-0 shadow-none rounded-full ${
              isAvailable
                ? "bg-[#99BD4A] text-white hover:bg-[#8aac3d]"
                : "bg-[#94a3b8] text-white hover:bg-[#8292a8]"
            }`}
          >
            {isAvailable ? "Tersedia" : "Dipinjam"}
          </Badge>
        </div>
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1">
        <Link href={`/detail-katalog/${bookId}?from=${currentFrom}`}>
          <h3 className="font-extrabold text-[#1e293b] text-[18px] leading-tight line-clamp-2 group-hover:text-[#99BD4A] transition-colors mb-1.5 cursor-pointer">
            {biblio.title || "Judul Tidak Diketahui"}
          </h3>
        </Link>
        <p className="text-[15px] font-medium text-slate-500 line-clamp-1 mb-3">
          {author}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-5 mt-auto">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-[14px] font-bold text-[#1e293b]">{rating}</span>
          <span className="text-[13px] font-medium text-slate-400">
            ({reviewCount} ulasan)
          </span>
        </div>

        {/* Action Button */}
        <Link
          href={`/detail-katalog/${bookId}?from=${currentFrom}`}
          className={`w-full py-3 rounded-xl text-[15px] font-bold transition-all duration-200 text-center block ${
            isAvailable
              ? "bg-[#f4f7f4] text-[#99BD4A] hover:bg-[#99BD4A] hover:text-white"
              : "bg-[#f1f5f9] text-[#94a3b8] hover:bg-slate-200"
          }`}
        >
          {isAvailable ? "Pinjam Sekarang" : "Ingatkan Saya"}
        </Link>
      </div>
    </div>
  );
}
