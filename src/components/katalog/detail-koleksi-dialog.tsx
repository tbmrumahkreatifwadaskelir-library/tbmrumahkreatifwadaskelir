import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookData } from "./koleksi-card";
import { BookOpen, MapPin, Hash, Building, Star, Calendar, Barcode } from "lucide-react";

interface DetailKoleksiDialogProps {
  biblio: BookData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailKoleksiDialog({
  biblio,
  isOpen,
  onClose,
}: DetailKoleksiDialogProps) {
  if (!biblio) return null;

  const imageUrl =
    biblio.image && biblio.image !== ""
      ? biblio.image.startsWith("http") || biblio.image.startsWith("/")
        ? biblio.image
        : `https://slims.web.id/web/${biblio.image}`
      : null;

  const isAvailable =
    biblio.book_type === "digital" ||
    biblio.availability?.toLowerCase() === "available" ||
    biblio.availability === "1" ||
    biblio.availability === "Tersedia" ||
    !biblio.availability;

  const rating = biblio.rating !== undefined ? Number(biblio.rating).toFixed(1) : "0.0";
  const reviewCount = biblio.total_review !== undefined ? biblio.total_review : 0;

  const infoItems = [
    { icon: Calendar, label: "Tahun Terbit", value: biblio.publish_year || "-" },
    { icon: Building, label: "Penerbit", value: biblio.publisher || "-" },
    { icon: Hash, label: "Nomor Panggil", value: biblio.call_number || "-" },
    { icon: Barcode, label: "ISBN / ISSN", value: biblio.isbn_issn || "-" },
    { icon: MapPin, label: "Tipe Koleksi", value: biblio.collection_type || "Teks" },
    { icon: BookOpen, label: "Klasifikasi", value: biblio.classification || "-" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white border-slate-100 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Left: Book Cover */}
          <div className="relative w-full bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center p-8 md:min-h-[480px]">
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={biblio.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-200 rounded-xl">
                  <BookOpen className="w-16 h-16" />
                </div>
              )}
            </div>
            {/* Badge */}
            <div className="absolute top-4 right-4">
              <Badge
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border-0 shadow-sm ${
                  isAvailable
                    ? "bg-[#99BD4A] hover:bg-[#99BD4A]/90 text-white"
                    : "bg-[#64748b] hover:bg-[#64748b]/90 text-white"
                }`}
              >
                {isAvailable ? "Tersedia" : "Dipinjam"}
              </Badge>
            </div>
          </div>

          {/* Right: Details */}
          <div className="p-8 flex flex-col max-h-[80vh] overflow-y-auto">
            <DialogHeader className="mb-5 text-left">
              <DialogTitle className="text-xl font-bold text-slate-800 leading-tight mb-1">
                {biblio.title}
              </DialogTitle>
              <DialogDescription className="text-[15px] text-[#99BD4A] font-semibold">
                {biblio.author || "Pengarang Tidak Diketahui"}
              </DialogDescription>
            </DialogHeader>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-slate-700">{rating}</span>
              <span className="text-xs text-slate-400">({reviewCount} ulasan)</span>
            </div>

            {/* Description */}
            {biblio.notes && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Deskripsi
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {biblio.notes}
                </p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#99BD4A]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#99BD4A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-5 border-t border-slate-100 mt-auto">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
              {isAvailable ? (
                <Link
                  href={`/detail-katalog/${biblio.biblio_id}`}
                  className="flex-1 py-2.5 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 bg-[#99BD4A] text-white hover:bg-[#8aac3d] shadow-sm"
                >
                  Pinjam Sekarang
                </Link>
              ) : (
                <button
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-slate-200 text-slate-500 cursor-not-allowed"
                  disabled
                >
                  Tidak Tersedia
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
