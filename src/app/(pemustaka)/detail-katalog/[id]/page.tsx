"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Star, Calendar, Clock, CheckCircle2, BookPlus, ShieldCheck, Truck, MapPin } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusModal } from "@/components/ui/status-modal";
import { useCreateLoanMutation } from "@/services/loans.service";
import { useBookDetailQuery, useAddBookReviewMutation, useUpdateBookReviewMutation, useDeleteBookReviewMutation } from "@/services/books.service";
import { useGetProfileQuery } from "@/services/auth.service";
import { useGetAdminSettingsQuery } from "@/services/admin-settings.service";
import { useBooksByDdcQuery } from "@/services/ddc.service";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface BookReview {
  id: number;
  rating: number;
  review: string;
  member: {
    id: number;
    name: string;
  };
  created_at: string;
  is_edited?: boolean;
}

interface MappedBook {
  id: string | number;
  title: string;
  author: string;
  ddc?: string;
  rating: string | number;
  isbn: string;
  publisher: string;
  year: string;
  language: string;
  pages: string;
  rack: string;
  loanDays: number;
  status: string;
  synopsis: string[];
  image: string | null;
  reviews?: BookReview[];
  book_type?: string;
}

interface SimilarBook {
  id: string | number;
  title: string;
  author: string;
  image: string | null;
}

const ddcCategories = [
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

function DetailKatalogContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const fromPage = searchParams?.get("from");

  const [book, setBook] = useState<MappedBook | null>(null);
  const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };
  
  // Modal states
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const { data: settingsRes } = useGetAdminSettingsQuery();
  const defaultLoanDuration = Number(settingsRes?.data?.settings?.loan_duration_days) || 7;
  
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<number>(defaultLoanDuration);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  
  // Review Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSuccessReviewModalOpen, setIsSuccessReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [createLoan, { isLoading: isCreatingLoan }] = useCreateLoanMutation();
  const [addBookReview, { isLoading: isSubmittingReview }] = useAddBookReviewMutation();
  const [updateBookReview, { isLoading: isUpdatingReview }] = useUpdateBookReviewMutation();
  const [deleteBookReview] = useDeleteBookReviewMutation();
  
  const { data: currentUserRes } = useGetProfileQuery();
  const currentUserId = currentUserRes?.data?.user?.id;

  // Date formatting
  const today = new Date();
  const todayStr = today.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  const actualDuration = selectedDuration === "custom" 
    ? customDuration 
    : (selectedDuration ? parseInt(selectedDuration) : defaultLoanDuration);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + actualDuration);
  const endDateStr = endDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });

  const { data: bookRes, isLoading: isBookLoading } = useBookDetailQuery(id, { skip: !id });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ddcCode = (bookRes?.data as any)?.ddc_code;
  const { data: ddcRes } = useBooksByDdcQuery(
    { code: ddcCode || "000", per_page: 7 }, 
    { skip: !ddcCode }
  );

  useEffect(() => {
    if (bookRes?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foundBook = bookRes.data as any;
      const mappedBook: MappedBook = {
        id: foundBook.id,
        title: foundBook.title,
        author: foundBook.author,
        ddc: foundBook.ddc_code,
        rating: "4.8",
        isbn: foundBook.isbn || "-",
        publisher: foundBook.publisher || "-",
        year: foundBook.publish_year || "-",
        language: "Indonesia",
        pages: foundBook.pages || "-",
        rack: foundBook.book_code || "-",
        loanDays: actualDuration,
        status: foundBook.is_available ? "TERSEDIA" : "DIPINJAM",
        synopsis: foundBook.description ? [foundBook.description] : ["Deskripsi tidak tersedia."],
        image: foundBook.cover_url || null,
        reviews: foundBook.reviews || [],
        book_type: foundBook.book_type || "physical",
      };
      
      if (mappedBook.reviews && mappedBook.reviews.length > 0) {
        const totalRating = mappedBook.reviews.reduce((sum: number, rev: BookReview) => sum + rev.rating, 0);
        mappedBook.rating = (totalRating / mappedBook.reviews.length).toFixed(1);
      } else {
        mappedBook.rating = "0.0";
      }

      setBook(mappedBook);
    } else {
      setBook(null);
    }
  }, [bookRes]);

  useEffect(() => {
    if (ddcRes?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resData = ddcRes.data as any;
      const booksArray = ("books" in resData && Array.isArray(resData.books)) ? resData.books : [];
      const similar = booksArray
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((b: any) => b.id.toString() !== id)
        .slice(0, 6)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          image: b.cover_url || null,
        }));
      setSimilarBooks(similar);
    }
  }, [ddcRes, id]);

  const isLoading = isBookLoading;

  if (isLoading) {
    return (
      <div className="flex-1 w-full bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#6B7280] font-medium text-sm">Memuat informasi buku...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">Buku Tidak Ditemukan</h2>
          <p className="text-[#6B7280] mb-6">Buku yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
          <Link href="/katalog" className="bg-[#99BD4A] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#87A840] transition-colors shadow-sm">
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = ddcCategories.find(c => c.code === book.ddc)?.label || "Katalog";

  return (
    <div className="flex-1 w-full bg-white min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-16 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[14px] text-[#6B7280] mt-8 mb-4 flex-wrap">
          {fromPage && ["beranda", "pinjaman", "profil", "notifikasi", "kegiatan"].includes(fromPage) ? (
            <>
              <Link href={fromPage === "beranda" ? "/" : `/${fromPage}`} className="hover:text-[#99BD4A] transition-colors capitalize">
                {fromPage}
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="font-bold text-[#111827]">Detail Buku</span>
            </>
          ) : (
            <>
              <Link href="/katalog" className="hover:text-[#99BD4A] transition-colors">
                Katalog
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <Link href={`/katalog?category=${book.ddc}`} className="hover:text-[#99BD4A] transition-colors">
                {categoryName}
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="font-bold text-[#111827]">Detail Buku</span>
            </>
          )}
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-8 py-4">
          {/* Kolom Kiri */}
          <div className="w-full lg:w-[32%] flex flex-col gap-6">
            <div className="bg-[#99BD4A] rounded-[24px] p-6 relative flex flex-col items-center justify-center min-h-[400px]">
              {/* Badge Tersedia */}
              <div className="absolute top-5 left-5 bg-[#87A840] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-2 tracking-widest uppercase shadow-sm z-10">
                <span className={`w-1.5 h-1.5 rounded-full ${book.status === "TERSEDIA" ? "bg-white" : "bg-red-500"}`}></span>
                {book.status}
              </div>

              {/* Cover */}
              <div className="w-[80%] aspect-[3/4] rounded-md shadow-2xl relative overflow-hidden flex items-center justify-center mt-4">
                {book.image ? (
                  <Image
                    src={book.image}
                    alt={book.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <span className="text-slate-400 font-medium text-sm">No Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informasi Buku Card */}
            <div className="bg-white rounded-[20px] p-7 shadow-sm border border-slate-100">
              <h3 className="font-bold text-[#111827] text-[16px] mb-6 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-[#99BD4A] text-[#99BD4A] flex items-center justify-center text-[12px] font-bold">i</div>
                Informasi Buku
              </h3>
              <div className="flex flex-col gap-4 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF] font-medium text-[13px]">ISBN</span>
                  <span className="font-bold text-[#111827] text-[13px]">{book.isbn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF] font-medium text-[13px]">Penerbit</span>
                  <span className="font-bold text-[#111827] text-[13px] text-right">{book.publisher}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF] font-medium text-[13px]">Tahun Terbit</span>
                  <span className="font-bold text-[#111827] text-[13px]">{book.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF] font-medium text-[13px]">Bahasa</span>
                  <span className="font-bold text-[#111827] text-[13px]">{book.language}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF] font-medium text-[13px]">Halaman</span>
                  <span className="font-bold text-[#111827] text-[13px]">{book.pages}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="w-full lg:flex-1 flex flex-col">
            {/* Title & Rating */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
              <h1 className="text-[40px] md:text-[44px] font-extrabold text-[#0F172A] leading-[1.15] lg:max-w-[85%]">
                {book.title}
              </h1>
              <div className="flex items-center gap-1.5 bg-[#FEFCE8] border border-yellow-100 rounded-xl px-4 py-2.5 shrink-0 shadow-sm mt-2 sm:mt-0">
                <Star className="w-4 h-4 fill-[#EAB308] text-[#EAB308]" />
                <span className="font-bold text-[#111827] text-[15px] ml-1">{book.rating}</span>
                <span className="text-[#6B7280] text-[13px]">/ 5 Rating</span>
              </div>
            </div>

            {/* Author & Category */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[#99BD4A] text-[15px] font-bold">{book.author}</span>
              <span className="text-slate-300">|</span>
              <span className="text-[#6B7280] text-[15px]">Kategori DDC: {book.ddc} - {categoryName}</span>
            </div>

            {/* Sinopsis Card */}
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 mb-6">
              <h3 className="font-extrabold text-[#111827] text-[18px] mb-4">Sinopsis</h3>
              <div className="text-[#4B5563] text-[15px] leading-[1.8] space-y-4">
                {book.synopsis.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Action Buttons Container */}
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              {/* Borrow Button */}
              <button 
                onClick={() => setIsBorrowModalOpen(true)}
                disabled={book.status !== "TERSEDIA"}
                className={`w-full font-bold text-[16px] py-4 rounded-[14px] shadow-sm transition-all flex items-center justify-center gap-2 ${
                  book.status === "TERSEDIA" 
                    ? "bg-[#99BD4A] hover:bg-[#87A840] text-white" 
                    : "bg-slate-200 text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                <BookPlus className="w-5 h-5" />
                {book.status === "TERSEDIA" ? "Pinjam Buku Sekarang" : "Buku Tidak Tersedia"}
              </button>

              {/* Review Button */}
              <button
                onClick={() => {
                  setEditingReviewId(null);
                  setReviewRating(5);
                  setReviewText("");
                  setIsReviewModalOpen(true);
                }}
                className="w-full font-bold text-[16px] py-4 rounded-[14px] shadow-sm transition-all flex items-center justify-center gap-2 bg-white border-2 border-[#99BD4A] text-[#99BD4A] hover:bg-[#F4F7F4]"
              >
                <Star className="w-5 h-5" />
                Tulis Ulasan Buku
              </button>
            </div>

            {/* Availability Notice */}
            <div className="bg-[#99BD4A]/10 border border-[#99BD4A]/20 rounded-[14px] p-5 flex items-start gap-3">
              <div className="mt-0.5 shrink-0 text-[#99BD4A]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-[#4B5563] text-[14px] leading-relaxed">
                {book.status === "TERSEDIA" 
                  ? `Buku ini tersedia dalam format fisik di Rak ${book.rack || "-"}. Durasi peminjaman maksimal ${defaultLoanDuration} hari.` 
                  : "Buku ini sedang dipinjam oleh pemustaka lain. Silakan cek kembali nanti atau hubungi pustakawan."}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 pt-10 border-t border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[24px] font-extrabold text-[#0F172A] mb-1">Ulasan Pembaca</h2>
              <p className="text-[15px] text-[#6B7280]">
                {book.reviews?.length || 0} ulasan dari pemustaka
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 fill-[#EAB308] text-[#EAB308]" />
              <span className="text-[24px] font-extrabold text-[#0F172A]">{book.rating}</span>
              <span className="text-[16px] text-[#6B7280] font-medium mt-1">/ 5</span>
            </div>
          </div>

          {book.reviews && book.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {book.reviews.map((review: BookReview) => (
                <div key={review.id} className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F4F7F4] flex items-center justify-center text-[#99BD4A] font-bold text-[16px]">
                        {review.member?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0F172A] text-[15px] leading-tight">
                          {review.member?.name || "Anonim"}
                        </h4>
                        <span className="text-[#9CA3AF] text-[12px]">
                          {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: idLocale }) : "Baru saja"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-[#EAB308] text-[#EAB308]" : "fill-slate-100 text-slate-100"}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {review.review && (
                    <p className="text-[#4B5563] text-[14px] leading-relaxed">
                      &quot;{review.review}&quot; {review.is_edited && <span className="text-[11px] text-slate-400 italic ml-1">(diedit)</span>}
                    </p>
                  )}
                  {review.member?.id === currentUserId && (
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setEditingReviewId(review.id);
                          setReviewRating(review.rating);
                          setReviewText(review.review || "");
                          setIsReviewModalOpen(true);
                        }}
                        className="text-[12px] font-bold text-[#99BD4A] hover:text-[#87A840] transition-colors"
                      >
                        Edit Ulasan
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Yakin ingin menghapus ulasan ini?")) return;
                          try {
                            await deleteBookReview(review.id).unwrap();
                            // Note: RTK Query refetch might be needed here, or invalidate tags.
                            // Currently rely on page refresh or tag invalidation if configured in books.service
                          } catch (err) {
                            console.error(err);
                            alert("Gagal menghapus ulasan.");
                          }
                        }}
                        className="text-[12px] font-bold text-red-500 hover:text-red-600 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F9FAFB] rounded-[24px] p-10 flex flex-col items-center justify-center text-center border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Star className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-[16px] mb-2">Belum ada ulasan</h3>
              <p className="text-[#6B7280] text-[14px] max-w-sm mb-6">
                Jadilah yang pertama mengulas buku ini. Bagikan pengalaman Anda membaca buku ini kepada pemustaka lain.
              </p>
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-white border border-slate-200 text-[#4B5563] font-bold px-6 py-2.5 rounded-full text-[14px] shadow-sm hover:bg-slate-50 transition-colors"
              >
                Tulis Ulasan
              </button>
            </div>
          )}
        </div>

        {/* Buku Serupa Section */}
        {similarBooks.length > 0 && (
          <div className="mt-12 pt-10 border-t border-slate-100">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-[24px] font-extrabold text-[#0F172A] mb-1">Buku Serupa</h2>
                <p className="text-[15px] text-[#6B7280]">Rekomendasi buku dari kategori {categoryName}</p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <button onClick={scrollLeft} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white bg-transparent transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <button onClick={scrollRight} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white bg-transparent transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Carousel */}
            <div ref={scrollRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {similarBooks.map((simBook) => (
                <Link 
                  href={`/detail-katalog/${simBook.id}`} 
                  key={simBook.id} 
                  className="flex flex-col gap-3 min-w-[160px] md:min-w-[200px] snap-start group cursor-pointer"
                >
                  <div className="w-full aspect-[3/4] bg-slate-100 rounded-[20px] overflow-hidden relative shadow-sm transition-all group-hover:shadow-md">
                    {simBook.image ? (
                      <Image
                        src={simBook.image}
                        alt={simBook.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <span className="text-slate-400 text-xs font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="px-1 mt-1">
                    <h4 className="font-bold text-[#0F172A] text-[16px] leading-snug group-hover:text-[#99BD4A] transition-colors mb-1 line-clamp-2">
                      {simBook.title}
                    </h4>
                    <p className="text-[13px] text-[#6B7280] line-clamp-1">{simBook.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Peminjaman */}
        {book && (
          <Dialog open={isBorrowModalOpen} onOpenChange={setIsBorrowModalOpen}>
            <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-0 bg-white rounded-[24px] border-none shadow-xl">
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-white z-10">
                <DialogTitle className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A]">Konfirmasi Peminjaman Buku</DialogTitle>
              </DialogHeader>
              
              <div className="p-5 sm:p-6 flex flex-col gap-5 sm:gap-6">
                {/* Card Buku di Dalam Modal */}
                <div className="bg-[#FCFDFC] border border-[#E5E7EB] rounded-[16px] p-3 sm:p-4 flex gap-3 sm:gap-5">
                  <div className="w-[70px] h-[100px] sm:w-[80px] sm:h-[110px] shrink-0 rounded-lg overflow-hidden relative shadow-sm border border-slate-100">
                    {book.image ? (
                      <Image src={book.image} alt={book.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-slate-200"></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-[11px] font-bold text-[#9CA3AF] tracking-widest uppercase mb-1">Detail Buku</span>
                    <h4 className="font-extrabold text-[#0F172A] text-[18px] leading-snug mb-1 line-clamp-1">{book.title}</h4>
                    <p className="text-[#6B7280] text-[14px] mb-3">{book.author}</p>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#F0F5E8] text-[#99BD4A] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {categoryName.split(' ')[0] || "FIKSI"}
                      </span>
                      <span className="text-[13px] text-[#6B7280] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#99BD4A]"></span>
                        Tersedia
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Input */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#0F172A]">Tanggal Mulai Pinjam</label>
                    <div className="border border-[#E5E7EB] rounded-xl px-4 py-3.5 bg-[#F9FAFB] flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#9CA3AF]" />
                      <span className="text-[14px] text-[#4B5563]">{todayStr}</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#0F172A]">Durasi Peminjaman</label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="py-6 w-full border-[#E5E7EB] rounded-xl px-4 bg-white hover:border-[#99BD4A] transition-colors focus:ring-0 focus:ring-offset-0 focus:border-[#99BD4A] outline-none">
                        <div className="flex items-center gap-3 text-left">
                          <Clock className="w-5 h-5 text-[#9CA3AF] shrink-0" />
                          <span className="text-[14px] text-[#0F172A] font-bold mt-0.5">
                            <SelectValue placeholder="Pilih durasi" />
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-[#E5E7EB] shadow-lg bg-white">
                        <SelectItem value="7" className="font-medium cursor-pointer py-2.5">7 Hari</SelectItem>
                        <SelectItem value={defaultLoanDuration.toString()} className="font-medium cursor-pointer py-2.5">{defaultLoanDuration} Hari (Standar)</SelectItem>
                        <SelectItem value="custom" className="font-medium cursor-pointer py-2.5">Tentukan Sendiri</SelectItem>
                        <SelectItem value="custom" className="font-medium cursor-pointer py-2.5 text-[#99BD4A]">Kustom...</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedDuration === "custom" && (
                      <div className="flex items-center gap-3 animate-in slide-in-from-top-1 fade-in mt-1">
                        <input 
                          type="number" 
                          min="1"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value) || 1)}
                          className="border border-[#E5E7EB] rounded-xl px-4 py-2.5 w-full text-[14px] font-bold text-[#0F172A] outline-none focus:border-[#99BD4A] transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" 
                          placeholder="Masukkan hari"
                        />
                        <span className="text-[13px] font-bold text-[#4B5563]">Hari</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Method */}
                {book.book_type !== "digital" && (
                  <>
                    <div className="flex flex-col gap-2 mt-4">
                      <label className="text-[13px] font-bold text-[#0F172A]">Metode Pengambilan</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod("pickup")}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                            deliveryMethod === "pickup"
                              ? "border-[#99BD4A] bg-[#f5f9ed]"
                              : "border-[#E5E7EB] bg-white hover:border-[#99BD4A]/40"
                          }`}
                        >
                          <BookPlus className={`w-5 h-5 shrink-0 ${deliveryMethod === "pickup" ? "text-[#99BD4A]" : "text-slate-400"}`} />
                          <div>
                            <p className={`text-[13px] font-bold ${deliveryMethod === "pickup" ? "text-[#4a7a1c]" : "text-[#374151]"}`}>Ambil Sendiri</p>
                            <p className="text-[11px] text-slate-400">Di perpustakaan</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod("delivery")}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                            deliveryMethod === "delivery"
                              ? "border-orange-400 bg-orange-50"
                              : "border-[#E5E7EB] bg-white hover:border-orange-300"
                          }`}
                        >
                          <Truck className={`w-5 h-5 shrink-0 ${deliveryMethod === "delivery" ? "text-orange-500" : "text-slate-400"}`} />
                          <div>
                            <p className={`text-[13px] font-bold ${deliveryMethod === "delivery" ? "text-orange-600" : "text-[#374151]"}`}>Pengiriman</p>
                            <p className="text-[11px] text-slate-400">Dikirim ke alamat</p>
                          </div>
                        </button>
                      </div>

                      {/* Delivery form — tampil jika pilih pengiriman */}
                      {deliveryMethod === "delivery" && (
                        <div className="mt-2 space-y-3 animate-in slide-in-from-top-1 fade-in">
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            <textarea
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Alamat lengkap pengiriman..."
                              rows={2}
                              className="w-full pl-9 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-orange-400 focus:bg-white transition-colors resize-none"
                            ></textarea>
                          </div>
                          <input
                            type="text"
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            placeholder="Catatan tambahan (Opsional)"
                            className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-orange-400 focus:bg-white transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Estimasi Tanggal Kembali */}
                <div className="bg-[#F4F7F4] border border-[#99BD4A]/30 border-dashed rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-[#6B7280] mb-1">Estimasi Tanggal Kembali</p>
                    <p className="font-extrabold text-[#0F172A] text-[16px]">{endDateStr}</p>
                  </div>
                  <Calendar className="w-6 h-6 text-[#99BD4A]" />
                </div>

                {/* Checkbox Syarat & Ketentuan */}
                <div className="flex items-start gap-3 mt-2">
                  <Checkbox 
                    id="terms" 
                    checked={isAgreed}
                    onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
                    className="mt-1 border-slate-300 data-[state=checked]:bg-[#99BD4A] data-[state=checked]:border-[#99BD4A]"
                  />
                  <label htmlFor="terms" className="text-[14px] text-[#4B5563] leading-relaxed cursor-pointer select-none">
                    Saya setuju mematuhi <span className="text-[#99BD4A] font-bold">aturan perpustakaan</span> Rumah Kreatif Wadas Kelir dan bertanggung jawab atas kondisi buku.
                  </label>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button 
                    onClick={() => setIsBorrowModalOpen(false)}
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl border border-slate-200 text-[#4B5563] font-bold text-[14px] sm:text-[15px] hover:bg-slate-50 transition-colors order-2 sm:order-1"
                  >
                    Batalkan
                  </button>
                  <button 
                    disabled={!isAgreed || isCreatingLoan || (deliveryMethod === "delivery" && !deliveryAddress.trim())}
                    onClick={async () => {
                      if (!book) return;
                      try {
                        const finalDuration = selectedDuration === "custom" ? customDuration : parseInt(selectedDuration);
                        await createLoan({
                          book_id: book.id,
                          loan_duration: finalDuration,
                          delivery_method: deliveryMethod,
                          ...(deliveryMethod === "delivery" && {
                            delivery_address: deliveryAddress,
                            delivery_notes: deliveryNotes || undefined,
                          }),
                        }).unwrap();
                        setIsBorrowModalOpen(false);
                        setIsAgreed(false);
                        setDeliveryMethod("pickup");
                        setDeliveryAddress("");
                        setDeliveryNotes("");
                        setTimeout(() => {
                          setIsSuccessModalOpen(true);
                        }, 200);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      } catch (err: any) {
                        setErrorMsg(err?.data?.message || "Terjadi kesalahan saat meminjam buku.");
                      }
                    }}
                    className={`w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl text-white font-bold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 transition-all order-1 sm:order-2 ${
                      isAgreed && !isCreatingLoan && !(deliveryMethod === "delivery" && !deliveryAddress.trim()) ? "bg-[#99BD4A] hover:bg-[#87A840] shadow-sm hover:-translate-y-0.5" : "bg-[#A3C757]/50 cursor-not-allowed"
                    }`}
                  >
                    {isCreatingLoan ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {isCreatingLoan ? "Memproses..." : "Konfirmasi Pinjam"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal Tulis Ulasan */}
        {book && (
          <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
            <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-0 bg-white rounded-[24px] border-none shadow-xl">
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-white z-10">
                <DialogTitle className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A]">Tulis Ulasan Buku</DialogTitle>
              </DialogHeader>
              
              <div className="p-5 sm:p-6 flex flex-col gap-5 sm:gap-6">
                {/* Rating */}
                <div>
                  <label className="text-[14px] font-bold text-[#0F172A] block mb-2">Penilaian Anda</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star className={`w-8 h-8 ${star <= reviewRating ? "fill-[#EAB308] text-[#EAB308]" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="text-[14px] font-bold text-[#0F172A] block mb-2">Ulasan Anda (Opsional)</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Bagikan pendapat Anda tentang buku ini..."
                    className="w-full min-h-[120px] border border-[#E5E7EB] rounded-xl p-4 text-[14px] outline-none focus:border-[#99BD4A] focus:ring-1 focus:ring-[#99BD4A] transition-colors resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button 
                    onClick={() => setIsReviewModalOpen(false)}
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl border border-slate-200 text-[#4B5563] font-bold text-[14px] sm:text-[15px] hover:bg-slate-50 transition-colors order-2 sm:order-1"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={isSubmittingReview || isUpdatingReview}
                    onClick={async () => {
                      if (!book) return;
                      try {
                        if (editingReviewId) {
                          await updateBookReview({ id: editingReviewId, data: { rating: reviewRating, review: reviewText } }).unwrap();
                        } else {
                          await addBookReview({ id: book.id, data: { rating: reviewRating, review: reviewText } }).unwrap();
                        }
                        setIsReviewModalOpen(false);
                        setReviewText("");
                        setReviewRating(5);
                        setEditingReviewId(null);
                        setTimeout(() => {
                          setIsSuccessReviewModalOpen(true);
                        }, 200);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      } catch (err: any) {
                        setErrorMsg(err?.data?.message || "Terjadi kesalahan saat mengirim ulasan.");
                      }
                    }}
                    className={`w-full sm:flex-1 py-3.5 sm:py-4 rounded-xl text-white font-bold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 transition-all order-1 sm:order-2 ${
                      !(isSubmittingReview || isUpdatingReview) ? "bg-[#99BD4A] hover:bg-[#87A840] shadow-sm hover:-translate-y-0.5" : "bg-[#A3C757]/50 cursor-not-allowed"
                    }`}
                  >
                    {(isSubmittingReview || isUpdatingReview) ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {(isSubmittingReview || isUpdatingReview) ? "Mengirim..." : "Kirim Ulasan"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <StatusModal
          isOpen={isSuccessReviewModalOpen}
          onOpenChange={setIsSuccessReviewModalOpen}
          status="success"
          title={
            <>
              Ulasan<br />Terkirim!
            </>
          }
          description="Terima kasih atas ulasan Anda! Penilaian Anda sangat berharga bagi pemustaka lainnya."
          actionLabel="Tutup"
          onAction={() => setIsSuccessReviewModalOpen(false)}
        />

        {/* Modal Sukses Peminjaman */}
        <StatusModal
          isOpen={isSuccessModalOpen}
          onOpenChange={setIsSuccessModalOpen}
          status="success"
          title={
            <>
              Permintaan Peminjaman<br />Terkirim!
            </>
          }
          description="Buku Anda sedang dalam proses verifikasi oleh admin. Silakan cek status peminjaman Anda secara berkala di halaman Riwayat."
          actionLabel="Kembali ke Beranda"
          actionHref="/"
          onAction={() => setIsSuccessModalOpen(false)}
        />

        {/* Modal Error */}
        {(() => {
          const isUnauthenticated = errorMsg?.toLowerCase().includes("unauthenticated");
          return (
            <StatusModal
              isOpen={!!errorMsg}
              onOpenChange={(open) => {
                if (!open) {
                  setErrorMsg("");
                  if (isUnauthenticated) {
                    router.push("/login");
                  }
                }
              }}
              status="failed"
              title={isUnauthenticated ? "Login Diperlukan" : "Terjadi Kesalahan"}
              description={isUnauthenticated ? "Anda harus login terlebih dahulu untuk meminjam buku." : errorMsg}
              actionLabel="Tutup"
              onAction={() => {
                setErrorMsg("");
                if (isUnauthenticated) {
                  router.push("/login");
                }
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}

export default function DetailKatalogPage() {
  return (
    <Suspense fallback={<div className="flex-1 w-full bg-white min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6B7280] font-medium text-sm">Memuat informasi buku...</p>
      </div>
    </div>}>
      <DetailKatalogContent />
    </Suspense>
  );
}
