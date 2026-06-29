"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

import { useMyLoansQuery } from "@/services/loans.service";

interface BorrowedBook {
  id: number;
  title: string;
  author: string;
  daysLeft: number;
  progress: number;
  borrowDate: string;
  returnDate: string;
  coverColor: string;
  coverAccent: string;
  image?: string | null;
}

function BookCover({ book }: { book: BorrowedBook }) {
  return (
    <div
      className="w-[88px] h-[116px] rounded-[14px] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm bg-slate-200"
    >
      {book.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(145deg, ${book.coverColor}, ${book.coverAccent})` }}
        >
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwyNSAxMEwzNSAxMEwyNyAxN0wzMCAyN0wyMCAyMkwxMCAyN0wxMyAxN0w1IDEwTDE1IDEwWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
          <span className="text-white text-[11px] font-bold text-center px-2 leading-snug drop-shadow-sm uppercase tracking-wide">
            {book.title}
          </span>
        </div>
      )}
    </div>
  );
}

export default function SedangDipinjam() {
  const { data: loansRes, isLoading } = useMyLoansQuery();
  const [loans, setLoans] = useState<BorrowedBook[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loansData = (loansRes?.data as any)?.loans || (loansRes?.data as any)?.data?.loans || [];

    if (loansData && Array.isArray(loansData) && loansData.length > 0) {
      // Filter only active loans (assuming status "active" or "overdue")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeLoans = loansData.filter((l: any) => l.status === "active" || l.status === "overdue" || l.status === "approved").slice(0, 5);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = activeLoans.map((loan: any) => {
        const returnDateVal = loan.return_date || loan.due_date;
        const returnDate = returnDateVal ? new Date(returnDateVal) : new Date();
        const borrowDate = loan.loan_date ? new Date(loan.loan_date) : new Date();
        const today = new Date();
        const diffTime = returnDate.getTime() - today.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        const totalDuration = returnDate.getTime() - borrowDate.getTime();
        const elapsed = today.getTime() - borrowDate.getTime();
        const progress = totalDuration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100))) : 100;

        return {
          id: loan.id || 0,
          title: loan.book?.title || "Buku Tanpa Judul",
          author: loan.book?.author || loan.book?.writer || "Penulis Tidak Diketahui",
          daysLeft: daysLeft,
          progress: progress,
          borrowDate: loan.loan_date ? new Date(loan.loan_date).toLocaleDateString("id-ID") : "-",
          returnDate: returnDateVal ? new Date(returnDateVal).toLocaleDateString("id-ID") : "-",
          coverColor: loan.book?.cover_color || "#385444",
          coverAccent: loan.book?.cover_accent || "#426152",
          image: loan.book?.cover_url || null,
        };
      });
      setLoans(mapped);
    } else if (loansData && Array.isArray(loansData) && loansData.length === 0) {
      setLoans([]);
    }
  }, [loansRes]);

  const currentlyBorrowed = loans.length;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1e293b]">Sedang Dipinjam</h2>
          {currentlyBorrowed > 0 && (
            <span className="px-2.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
              {currentlyBorrowed} Buku
            </span>
          )}
        </div>
        <Link
          href="/pinjaman"
          className="text-sm font-semibold text-[#99BD4A] hover:text-[#7A9A35] transition-colors"
        >
          Lihat Semua
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : loans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loans.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-[20px] border border-slate-100 p-5 flex flex-col gap-6 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 group cursor-pointer"
            >
              {/* Top Section */}
              <div className="flex gap-4">
                <BookCover book={book} />
                
                <div className="flex-1 flex flex-col justify-center py-1">
                  <h3 className="font-extrabold text-[18px] text-[#1e293b] leading-tight mb-1.5 group-hover:text-[#99BD4A] transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-[15px] font-medium text-slate-500 mb-3">
                    {book.author}
                  </p>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <Clock className={`w-4 h-4 ${book.daysLeft <= 5 ? "text-orange-500" : "text-[#99BD4A]"}`} />
                    <span className={`text-[13px] font-bold ${book.daysLeft <= 5 ? "text-orange-500" : "text-[#99BD4A]"}`}>
                      Sisa {book.daysLeft} Hari
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-bold text-slate-500">Progres Waktu</span>
                  <span className="text-[14px] font-bold text-slate-600">{book.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-[#99BD4A]"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <div className="mt-2 text-right">
                  <span className="text-[12px] font-medium text-slate-400">
                    Pinjam: {book.borrowDate} - Kembali: {book.returnDate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-100 p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F4F7F4] rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-[#99BD4A]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1e293b] mb-2">
            Belum Ada Buku Dipinjam
          </h3>
          <p className="text-[14px] text-slate-500 max-w-[280px]">
            Kamu belum meminjam buku apa pun saat ini. Yuk, mulai eksplorasi katalog kami!
          </p>
          <Link
            href="/katalog"
            className="mt-6 px-6 py-2.5 bg-[#99BD4A] text-white text-sm font-bold rounded-full hover:bg-[#88ab3d] transition-colors"
          >
            Cari Buku
          </Link>
        </div>
      )}
    </section>
  );
}
