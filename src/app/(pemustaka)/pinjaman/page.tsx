"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Clock, Calendar, CheckCircle, RotateCcw, AlertCircle, Info, X,
  CreditCard, Banknote, RefreshCw, ExternalLink, ShieldCheck, Truck
} from "lucide-react";
import { useMyLoansQuery, useExtendLoanMutation, useRetryDeliveryPaymentMutation, useGetDigitalStreamUrlMutation } from "@/services/loans.service";
import {
  useMyFinesQuery,
  useMyFinesSummaryQuery,
  usePayFineMutation,
  usePaymentStatusQuery,
} from "@/services/fines.service";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusModal } from "@/components/ui/status-modal";
import { Button } from "@/components/ui/button";
import { DigitalBookViewer } from "@/components/ui/digital-book-viewer";

type LoanStatus = "SEDANG_DIPINJAM" | "MENUNGGU_PERSETUJUAN" | "SELESAI" | "DITOLAK";

interface LoanItem {
  id: string | number;
  title: string;
  author: string;
  status: LoanStatus;
  image: string | null;
  daysLeft?: number;
  borrowDate?: string;
  returnDate?: string;
  requestDate?: string;
  returnedDate?: string;
  rejectionReason?: string;
  deliveryMethod?: string;
  deliveryStatus?: string | null;
  deliveryPaymentUrl?: string | null;
  digitalAccess?: {
    access_token: string;
    read_url: string;
    is_valid: boolean;
  } | null;
}

const tabs = ["Semua", "Menunggu Persetujuan", "Sedang Dipinjam", "Selesai/Dikembalikan", "Ditolak", "Denda"];

// --- Sub-component: Payment Status Checker ---
function FinePaymentStatusBadge({ fineId }: { fineId: string | number }) {
  const { data, isFetching, refetch } = usePaymentStatusQuery({ id: fineId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payment = (data?.data as any)?.payment;

  if (!payment) return null;

  const statusMap: Record<string, { label: string; className: string }> = {
    pending:  { label: "Menunggu Pembayaran", className: "bg-yellow-100 text-yellow-700" },
    success:  { label: "Pembayaran Berhasil", className: "bg-green-100 text-green-700" },
    failed:   { label: "Pembayaran Gagal",    className: "bg-red-100 text-red-600" },
    expired:  { label: "Kedaluwarsa",         className: "bg-slate-100 text-slate-500" },
  };

  const info = statusMap[payment.status] ?? { label: payment.status, className: "bg-slate-100 text-slate-600" };

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${info.className}`}>
        {info.label}
      </span>
      {payment.status === "pending" && payment.payment_url && (
        <a
          href={payment.payment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          Lanjut Bayar <ExternalLink className="w-3 h-3" />
        </a>
      )}
      <button
        onClick={() => refetch()}
        disabled={isFetching}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        title="Cek ulang status"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

export default function PinjamanPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const { data: loansRes, isLoading } = useMyLoansQuery();
  const [extendLoan, { isLoading: isExtending }] = useExtendLoanMutation();
  const [retryDelivery, { isLoading: isRetryingDelivery }] = useRetryDeliveryPaymentMutation();
  const [getStreamUrl, { isLoading: isGettingStream }] = useGetDigitalStreamUrlMutation();
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | number | null>(null);
  const [readingLoanId, setReadingLoanId] = useState<string | number | null>(null);

  // Fine-related hooks
  const { data: finesRes, isLoading: isLoadingFines, refetch: refetchFines } = useMyFinesQuery(undefined, {
    skip: activeTab !== "Denda",
  });
  const { data: finesSummaryRes } = useMyFinesSummaryQuery(undefined, {
    skip: activeTab !== "Denda",
  });
  const [payFine, { isLoading: isPayingFine }] = usePayFineMutation();

  // Selected fine for payment status checker
  const [payingFineId, setPayingFineId] = useState<string | number | null>(null);

  // Extend modal
  const [confirmExtendModalOpen, setConfirmExtendModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | number | null>(null);
  const [extendDays, setExtendDays] = useState<number | "">(7);
  const [extendReason, setExtendReason] = useState("");

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<"success" | "failed">("success");
  const [statusModalTitle, setStatusModalTitle] = useState("");
  const [statusModalMessage, setStatusModalMessage] = useState("");

  const showStatus = (type: "success" | "failed", title: string, message: string) => {
    setStatusModalType(type);
    setStatusModalTitle(title);
    setStatusModalMessage(message);
    setStatusModalOpen(true);
  };

  // Digital Book Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerToken, setViewerToken] = useState("");

  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loansData = (loansRes?.data as any)?.loans || [];

  let finesData: Record<string, unknown>[] = [];
  const rawFines = finesRes?.data as Record<string, unknown> | undefined;
  if (rawFines) {
    if (Array.isArray(rawFines)) finesData = rawFines;
    else if (Array.isArray(rawFines.data)) finesData = rawFines.data as Record<string, unknown>[];
    else if (Array.isArray(rawFines.fines)) finesData = rawFines.fines as Record<string, unknown>[];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary = finesSummaryRes?.data as any;

  const mappedLoans: LoanItem[] = loansData.map((loan: Record<string, unknown>) => {
    let status: LoanStatus = "SELESAI";
    if (loan.status === "pending") status = "MENUNGGU_PERSETUJUAN";
    else if (loan.status === "active" || loan.status === "overdue") status = "SEDANG_DIPINJAM";
    else if (loan.status === "rejected") status = "DITOLAK";

    const returnDateVal = loan.return_date || loan.due_date;
    const returnDate = returnDateVal ? new Date(returnDateVal as string) : new Date();
    const today = new Date();
    const diffTime = returnDate.getTime() - today.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book = loan.book as any;
    const imagePath = book?.image || book?.cover_url || book?.cover_image;
    const image = imagePath && imagePath !== ""
      ? (imagePath.startsWith("http") || imagePath.startsWith("/") ? imagePath : `https://slims.web.id/web/${imagePath}`)
      : null;

    return {
      id: loan.id as string | number,
      title: book?.title || "Buku Tanpa Judul",
      author: book?.author || book?.writer || "Penulis Tidak Diketahui",
      status,
      image,
      daysLeft,
      borrowDate: loan.loan_date ? new Date(loan.loan_date as string).toLocaleDateString("id-ID") : "-",
      returnDate: loan.due_date ? new Date(loan.due_date as string).toLocaleDateString("id-ID") : "-",
      requestDate: loan.created_at ? new Date(loan.created_at as string).toLocaleDateString("id-ID") : "-",
      returnedDate: loan.return_date ? new Date(loan.return_date as string).toLocaleDateString("id-ID") : "-",
      rejectionReason: loan.rejection_reason as string | undefined,
      deliveryMethod: loan.delivery_method as string | undefined,
      deliveryStatus: (loan.delivery_payment_status ?? loan.delivery_status) as string | null | undefined,
      deliveryPaymentUrl: (loan.delivery_payment_url ?? loan.delivery_pay_url) as string | null | undefined,
      digitalAccess: loan.digital_access as { read_url: string; is_valid: boolean } | null | undefined,
    };
  });

  const filteredLoans = mappedLoans.filter((loan) => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Menunggu Persetujuan" && loan.status === "MENUNGGU_PERSETUJUAN") return true;
    if (activeTab === "Sedang Dipinjam" && loan.status === "SEDANG_DIPINJAM") return true;
    if (activeTab === "Selesai/Dikembalikan" && loan.status === "SELESAI") return true;
    if (activeTab === "Ditolak" && loan.status === "DITOLAK") return true;
    return false;
  });

  const handlePayFine = async (fineId: string | number) => {
    setPayingFineId(fineId);
    try {
      const res = await payFine({ id: fineId }).unwrap();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentUrl = (res.data as any)?.payment?.payment_url;
      if (paymentUrl) {
        window.open(paymentUrl, "_blank");
        showStatus(
          "success",
          "Dialihkan ke Pembayaran",
          "Silakan selesaikan pembayaran di halaman DOKU Checkout yang telah dibuka di tab baru. Kembali ke halaman ini setelah selesai untuk mengecek status."
        );
        refetchFines();
      } else {
        showStatus("failed", "Gagal", "Link pembayaran tidak ditemukan dari server.");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showStatus("failed", "Gagal Membuat Pembayaran", err?.data?.message || "Terjadi kesalahan sistem.");
    } finally {
      setPayingFineId(null);
    }
  };

  const handleRetryDelivery = async (loanId: string | number) => {
    setRetryingDeliveryId(loanId);
    try {
      const res = await retryDelivery(loanId).unwrap();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentUrl = (res.data as any)?.payment_url ?? (res.data as any)?.payment?.payment_url;
      if (paymentUrl) {
        window.open(paymentUrl, "_blank");
        showStatus(
          "success",
          "Pembayaran Ongkir Dibuka",
          "Silakan selesaikan pembayaran biaya pengiriman di halaman yang telah dibuka di tab baru."
        );
      } else {
        showStatus("success", "Berhasil", "Permintaan pembayaran ulang ongkir berhasil dikirim.");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showStatus("failed", "Gagal Retry Ongkir", err?.data?.message || "Terjadi kesalahan sistem.");
    } finally {
      setRetryingDeliveryId(null);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#FCFDFC] min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#1e293b] mb-2 leading-tight">
            Riwayat Peminjaman Saya
          </h1>
          <p className="text-[#64748b] text-[15px] sm:text-[16px]">
            Pantau status peminjaman, batas waktu, dan pengembalian buku Anda di sini.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-5 sm:gap-8 border-b border-slate-200 mb-6 sm:mb-8 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[15px] font-bold whitespace-nowrap transition-colors relative ${
                activeTab === tab ? "text-[#99BD4A]" : "text-[#64748b] hover:text-slate-800"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#99BD4A] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 sm:gap-6">

          {/* ─── TAB: DENDA ─── */}
          {activeTab === "Denda" ? (
            isLoadingFines ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Summary Banner */}
                {summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {/* Total */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Denda</p>
                      <p className="text-2xl font-black text-slate-800 leading-none">{summary.total_fines ?? 0}</p>
                      <p className="text-[11px] text-slate-400 mt-1">transaksi</p>
                    </div>

                    {/* Belum Bayar */}
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Belum Bayar</p>
                      <p className="text-lg font-black text-red-600 leading-none">
                        Rp {new Intl.NumberFormat("id-ID").format(Number(summary.unpaid_total ?? 0))}
                      </p>
                      <p className="text-[11px] text-red-400 mt-1">{summary.unpaid_count ?? 0} transaksi</p>
                    </div>

                    {/* Sudah Lunas */}
                    <div className="bg-[#f0f5e8] border border-[#d8eab8] rounded-2xl p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-[#7a9e3b] uppercase tracking-widest mb-2">Sudah Lunas</p>
                      <p className="text-lg font-black text-[#5a7a2a] leading-none">
                        Rp {new Intl.NumberFormat("id-ID").format(Number(summary.paid_total ?? 0))}
                      </p>
                      <p className="text-[11px] text-[#7a9e3b] mt-1">{summary.paid_count ?? 0} transaksi</p>
                    </div>

                    {/* Dibebaskan */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Dibebaskan</p>
                      <p className="text-2xl font-black text-blue-700 leading-none">{summary.waived_count ?? 0}x</p>
                      <p className="text-[11px] text-blue-400 mt-1">
                        Rp {new Intl.NumberFormat("id-ID").format(Number(summary.waived_total ?? 0))}
                      </p>
                    </div>
                  </div>
                )}

                {finesData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  finesData.map((fine: any) => (
                    <div
                      key={fine.id}
                      className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                        <div className="flex-1">
                          {/* Status Badge */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {fine.status === "unpaid" && (
                              <span className="bg-red-100 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                BELUM DIBAYAR
                              </span>
                            )}
                            {fine.status === "paid" && (
                              <span className="bg-[#f0f5e8] text-[#8ca846] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                LUNAS
                              </span>
                            )}
                            {fine.status === "waived" && (
                              <span className="bg-blue-100 text-blue-600 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                DIBEBASKAN
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-[#1e293b] text-[18px] sm:text-[20px] leading-tight mb-1">
                            {fine.book_title || "Buku Tanpa Judul"}
                          </h3>
                          <p className="text-[#64748b] text-[14px] font-medium">
                            Terlambat: <span className="text-red-500 font-bold">{fine.days_late} Hari</span>
                          </p>

                          {/* Payment Status Checker (hanya jika sudah ada transaksi) */}
                          {fine.latest_payment && (
                            <FinePaymentStatusBadge fineId={fine.id} />
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-[13px] text-slate-400 mb-1">Total Denda</div>
                          <div className="text-[22px] font-black text-red-600">
                            Rp {new Intl.NumberFormat("id-ID").format(Number(fine.fine_amount))}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <div className="text-[#94a3b8] text-[13px] font-medium space-y-0.5">
                          <div>Dibuat: {new Date(fine.created_at).toLocaleDateString("id-ID")}</div>
                          {fine.status === "paid" && fine.paid_at && (
                            <div className="text-[#8ca846]">
                              Dibayar: {new Date(fine.paid_at).toLocaleDateString("id-ID")}
                            </div>
                          )}
                          {fine.status === "waived" && fine.waived_reason && (
                            <div className="text-blue-500">Alasan: {fine.waived_reason}</div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {fine.status === "unpaid" && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Jika ada link pending, tampilkan tombol lanjut bayar */}
                            {fine.latest_payment?.status === "pending" && fine.latest_payment?.payment_url ? (
                              <a
                                href={fine.latest_payment.payment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-[10px] font-bold text-[13px] transition-colors shadow-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Lanjutkan Pembayaran
                              </a>
                            ) : (
                              <button
                                onClick={() => handlePayFine(fine.id)}
                                disabled={isPayingFine && payingFineId === fine.id}
                                className="flex items-center gap-2 bg-[#99BD4A] hover:bg-[#88ab3d] text-white px-5 py-2.5 rounded-[10px] font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50"
                              >
                                <CreditCard className="w-4 h-4" />
                                {isPayingFine && payingFineId === fine.id ? "Memproses..." : "Bayar via DOKU"}
                              </button>
                            )}
                          </div>
                        )}

                        {fine.status === "paid" && (
                          <div className="flex items-center gap-2 text-[#8ca846]">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-[13px] font-bold">Pembayaran Terverifikasi</span>
                          </div>
                        )}

                        {fine.status === "waived" && (
                          <div className="flex items-center gap-2 text-blue-500">
                            <Banknote className="w-5 h-5" />
                            <span className="text-[13px] font-bold">Denda Dibebaskan Admin</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                    <ShieldCheck className="w-12 h-12 text-[#99BD4A] mx-auto mb-3" />
                    <p className="text-[#1e293b] font-bold text-lg mb-1">Tidak Ada Denda</p>
                    <p className="text-[#64748b] text-sm">Anda tidak memiliki riwayat denda apapun. Tetap jaga waktu pengembalian!</p>
                  </div>
                )}
              </>
            )
          ) : isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (

            /* ─── LOAN CARDS ─── */
            filteredLoans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6 shadow-sm hover:shadow-md transition-shadow">

                {/* Book Cover */}
                <div className="w-[140px] h-[190px] sm:w-[130px] sm:h-[175px] shrink-0 rounded-xl overflow-hidden bg-slate-100 relative shadow-sm border border-slate-100 mx-auto sm:mx-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <span className="text-slate-500 font-bold text-center px-2 text-xs">{loan.title}</span>
                  </div>
                  {loan.image && (
                    <Image
                      src={loan.image}
                      alt={loan.title}
                      fill
                      className="object-cover relative z-10"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      unoptimized
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                    <div>
                      <div className="mb-3">
                        {loan.status === "SEDANG_DIPINJAM" && (
                          <span className="bg-[#f0f5e8] text-[#8ca846] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">SEDANG DIPINJAM</span>
                        )}
                        {loan.status === "MENUNGGU_PERSETUJUAN" && (
                          <span className="bg-[#fef3c7] text-[#d97706] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">MENUNGGU PERSETUJUAN</span>
                        )}
                        {loan.status === "SELESAI" && (
                          <span className="bg-[#e2e8f0]/60 text-[#64748b] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">SELESAI</span>
                        )}
                        {loan.status === "DITOLAK" && (
                          <span className="bg-red-100 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">DITOLAK</span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-[#1e293b] text-[18px] sm:text-[22px] leading-tight mb-1">{loan.title}</h3>
                      <p className="text-[#64748b] text-[14px] sm:text-[15px] font-medium">{loan.author}</p>
                    </div>

                    {loan.status === "SEDANG_DIPINJAM" && loan.daysLeft !== undefined && (
                      <div className={`flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 ${loan.daysLeft <= 3 ? "text-[#f97316] bg-[#fff7ed]" : "text-[#99BD4A] bg-[#99BD4A]/10"}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-[12px] sm:text-[13px] font-bold">Sisa {loan.daysLeft} Hari</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="mb-6 flex flex-wrap items-center gap-4 text-[#94a3b8] text-[13px] font-medium">
                    {loan.status === "SEDANG_DIPINJAM" && (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Pinjam: {loan.borrowDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#99BD4A]">
                          <Calendar className="w-4 h-4" />
                          <span>Kembali: {loan.returnDate}</span>
                        </div>
                      </>
                    )}
                    {loan.status === "MENUNGGU_PERSETUJUAN" && (
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        <span>Diajukan pada: {loan.requestDate}</span>
                      </div>
                    )}
                    {loan.status === "SELESAI" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Dikembalikan: {loan.returnedDate}</span>
                      </div>
                    )}
                    {loan.status === "DITOLAK" && (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Alasan: {loan.rejectionReason || "Tidak memenuhi syarat"}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-3 pt-2 flex-wrap">
                    {loan.status === "SEDANG_DIPINJAM" && loan.digitalAccess?.is_valid && (
                      <button
                        onClick={async () => {
                          setReadingLoanId(loan.id);
                          try {
                            const res = await getStreamUrl(loan.digitalAccess!.access_token).unwrap();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const streamUrl = (res.data as any)?.stream_url;
                            if (streamUrl) {
                              setViewerUrl(streamUrl);
                              setViewerTitle(loan.title);
                              setViewerToken(loan.digitalAccess!.access_token);
                              setViewerOpen(true);
                            } else {
                              showStatus("failed", "Akses Gagal", "Gagal memuat dokumen digital.");
                            }
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          } catch (err: any) {
                            showStatus("failed", "Akses Ditolak", err?.data?.message || "Token tidak valid atau kedaluwarsa.");
                          } finally {
                            setReadingLoanId(null);
                          }
                        }}
                        disabled={isGettingStream && readingLoanId === loan.id}
                        className="w-full sm:w-auto bg-[#99BD4A] hover:bg-[#87a840] text-white px-5 py-2.5 rounded-[10px] font-bold text-[13px] sm:text-[14px] transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <ExternalLink className={`w-4 h-4 ${isGettingStream && readingLoanId === loan.id ? "animate-pulse" : ""}`} />
                        {isGettingStream && readingLoanId === loan.id ? "Memuat..." : "Baca Buku"}
                      </button>
                    )}
                    {loan.status === "SEDANG_DIPINJAM" && (!loan.digitalAccess || loan.deliveryMethod === "delivery" || loan.deliveryMethod === "pickup") && (
                      <button
                        onClick={() => { setSelectedLoanId(loan.id); setConfirmExtendModalOpen(true); }}
                        disabled={isExtending}
                        className="w-full sm:w-auto bg-white border border-[#99BD4A] text-[#99BD4A] hover:bg-[#99BD4A] hover:text-white px-5 py-2.5 rounded-[10px] font-bold text-[13px] sm:text-[14px] transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className={`w-4 h-4 shrink-0 ${isExtending ? "animate-spin" : ""}`} />
                        Ajukan Perpanjangan
                      </button>
                    )}
                    {/* Retry Delivery Payment — tampil jika delivery & status bayar ongkir gagal/belum */}
                    {loan.status === "SEDANG_DIPINJAM" && loan.deliveryMethod === "delivery" && (
                      loan.deliveryStatus === "failed" || loan.deliveryStatus === "expired" || loan.deliveryStatus === null
                    ) && (
                      loan.deliveryPaymentUrl ? (
                        <a
                          href={loan.deliveryPaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-[10px] font-bold text-[13px] transition-colors shadow-sm"
                        >
                          <Truck className="w-4 h-4" />
                          Bayar Ongkir
                        </a>
                      ) : (
                        <button
                          onClick={() => handleRetryDelivery(loan.id)}
                          disabled={isRetryingDelivery && retryingDeliveryId === loan.id}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-[10px] font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Truck className={`w-4 h-4 ${isRetryingDelivery && retryingDeliveryId === loan.id ? "animate-bounce" : ""}`} />
                          {isRetryingDelivery && retryingDeliveryId === loan.id ? "Memproses..." : "Bayar Ulang Ongkir"}
                        </button>
                      )
                    )}
                    {loan.status === "MENUNGGU_PERSETUJUAN" && (
                      <button className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-[#64748b] px-5 py-2.5 rounded-[10px] font-bold text-[13px] sm:text-[14px] transition-colors shadow-sm text-center">
                        Batalkan Pesanan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {activeTab !== "Denda" && !isLoading && filteredLoans.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[24px] border border-slate-100 shadow-sm">
              <p className="text-[#64748b] font-medium">Tidak ada riwayat peminjaman di kategori ini.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL PERPANJANGAN */}
      <Dialog open={confirmExtendModalOpen} onOpenChange={setConfirmExtendModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white border-0 rounded-2xl [&>button]:hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-blue-500" />
              </div>
              <button onClick={() => setConfirmExtendModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <DialogTitle className="text-lg font-black text-slate-800 mb-2">Konfirmasi Perpanjangan</DialogTitle>
            <p className="text-sm font-medium text-slate-500 mb-4">Apakah Anda yakin ingin mengajukan perpanjangan buku ini?</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[13px] font-bold text-[#0F172A] block mb-1.5">Durasi Tambahan (Hari)</label>
                <input
                  type="number" min="1" max="30" value={extendDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") setExtendDays("");
                    else { const n = Number(val); if (!isNaN(n)) setExtendDays(n); }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#99BD4A] transition-colors"
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#0F172A] block mb-1.5">Alasan Perpanjangan</label>
                <textarea
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="Opsional, misal: belum selesai baca..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#99BD4A] transition-colors resize-none min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmExtendModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
                Batal
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedLoanId) return;
                  setConfirmExtendModalOpen(false);
                  try {
                    const finalDays = typeof extendDays === "number" ? Math.max(1, extendDays) : 1;
                    await extendLoan({ id: selectedLoanId, days_requested: finalDays, reason: extendReason }).unwrap();
                    showStatus("success", "Berhasil!", "Perpanjangan berhasil diajukan.");
                    setExtendDays(7);
                    setExtendReason("");
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } catch (err: any) {
                    showStatus("failed", "Gagal Mengajukan", err?.data?.message || "Terjadi kesalahan sistem.");
                  }
                }}
                disabled={isExtending}
                className="flex-1 h-12 rounded-xl font-bold bg-[#99BD4A] hover:bg-[#88ab3d] text-white disabled:opacity-50"
              >
                {isExtending ? "Memproses..." : "Ya, Ajukan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL STATUS */}
      <StatusModal
        isOpen={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        status={statusModalType}
        title={statusModalTitle}
        description={statusModalMessage}
        actionLabel="Tutup"
      />

      {/* PDF VIEWER MODAL */}
      <DigitalBookViewer 
        isOpen={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        fileUrl={viewerUrl} 
        title={viewerTitle}
        onExpand={() => router.push(`/baca/${viewerToken}`)}
      />
    </div>
  );
}
