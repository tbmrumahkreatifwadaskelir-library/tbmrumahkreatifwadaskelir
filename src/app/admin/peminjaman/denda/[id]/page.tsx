"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote, AlertTriangle, QrCode, X, Landmark } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SiteHeader } from "@/components/site-header";
import { StatusModal } from "@/components/ui/status-modal";
import { useAdminLoanDetailQuery } from "@/services/loans.service";
import { useAdminConfirmManualPaymentMutation, useAdminWaiveFineMutation, useSimulateDokuWebhookMutation } from "@/services/fines.service";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function DetailDendaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const { data: loanRes, isLoading, refetch } = useAdminLoanDetailQuery(id, { skip: !id });
  const [confirmManualPayment, { isLoading: isConfirming }] = useAdminConfirmManualPaymentMutation();
  const [waiveFine, { isLoading: isWaiving }] = useAdminWaiveFineMutation();

  const [paymentModalState, setPaymentModalState] = useState<"idle" | "select" | "success">("idle");
  const [warningModalState, setWarningModalState] = useState<"idle" | "confirm" | "success">("idle");
  const [selectedMethod, setSelectedMethod] = useState("cash");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dokuInvoiceModal, setDokuInvoiceModal] = useState(false);
  const [dokuInvoiceInput, setDokuInvoiceInput] = useState("");

  const loanData = (loanRes?.data as { loan?: Record<string, unknown> })?.loan || (loanRes?.data as Record<string, unknown>);

  const [simulateDokuWebhook] = useSimulateDokuWebhookMutation();

  const handlePaymentSubmit = async () => {
    if (selectedMethod === "doku_webhook") {
      setPaymentModalState("idle");
      setDokuInvoiceInput("");
      setDokuInvoiceModal(true);
      return;
    }
    await processPayment(selectedMethod);
  };

  const processPayment = async (method: string, invoiceNum?: string) => {
    try {
      if (method === "cash" || method === "transfer") {
        await confirmManualPayment({
          id,
          payment_method: method,
          notes: `Pembayaran via ${method === 'cash' ? 'Tunai' : 'Transfer Manual'} di meja admin`,
        }).unwrap();
      } else if (method === "doku_webhook") {
        if (!invoiceNum) return;
        await simulateDokuWebhook({
          invoice_number: invoiceNum,
          amount: penaltyAmountNum,
        }).unwrap();
      } else {
        setErrorMessage("Metode pembayaran tidak valid.");
        return;
      }
      setPaymentModalState("success");
      refetch();
    } catch (err: unknown) {
      console.error("Payment action failed:", err);
      const apiErr = err as { data?: { message?: string }; status?: number };
      const msg = apiErr?.data?.message ?? "Aksi pembayaran gagal. Periksa kembali data atau invoice.";
      setPaymentModalState("idle");
      setErrorMessage(msg);
    }
  };

  const handlePaymentComplete = () => {
    setPaymentModalState("idle");
    router.push("/admin/peminjaman");
  };

  const handleWaiveSubmit = async () => {
    try {
      await waiveFine({
        id,
        reason: "Dibebaskan oleh admin",
      }).unwrap();
      setWarningModalState("success");
      refetch();
    } catch (err) {
      console.error("Waive fine failed:", err);
      setWarningModalState("idle");
      setErrorMessage("Gagal membebaskan denda. Silakan coba lagi.");
    }
  };

  const handleWarningComplete = () => {
    setWarningModalState("idle");
    router.push("/admin/peminjaman");
  };

  if (isLoading || !loanData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500 font-medium">Memuat data...</p>
      </div>
    );
  }

  const member = (loanData?.member as Record<string, unknown>) || {};
  const user = (member?.user as Record<string, unknown>) || {};
  const book = (loanData?.book as Record<string, unknown>) || {};
  
  const memberName = (user?.name as string) || (member?.name as string) || "Anggota";
  const memberCode = (member?.member_code as string) || "-";
  const bookTitle = (book?.title as string) || "-";
  const bookAuthor = (book?.author as string) || "-";
  
  const borrowDateStr = (loanData?.loan_date as string) || (loanData?.created_at as string);
  const borrowDate = borrowDateStr ? format(new Date(borrowDateStr), "dd MMM yyyy", { locale: idLocale }) : "-";
  
  const dueDateStr = loanData?.due_date as string;
  const dueDate = dueDateStr ? format(new Date(dueDateStr), "dd MMM yyyy", { locale: idLocale }) : "-";

  const lateNumber = Number(loanData?.days_late) || 0;
  
  const fines = (loanData?.fines as Record<string, unknown>[]) || [];
  let penaltyAmountNum = Number(loanData?.fine_amount) || 0;
  if (penaltyAmountNum === 0 && fines.length > 0) {
    penaltyAmountNum = fines.reduce((sum, f) => sum + (Number(f.fine_amount) || 0), 0);
  }
  
  // Jika penalty masih 0 dan ada keterlambatan, hitung secara manual sebagai fallback estimasi (opsional)
  // Tarif denda per hari misalnya 5000
  if (penaltyAmountNum === 0 && lateNumber > 0) {
    penaltyAmountNum = lateNumber * 5000;
  }
  
  const penaltyAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(penaltyAmountNum);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader
        title="Kelola Peminjaman Anggota"
        subtitle="Pantau dan verifikasi pengajuan pinjaman buku dari anggota"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        
        {/* HEADER & BREADCRUMB */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-1">{memberName}</h2>
              <p className="text-sm font-medium text-slate-500">ID Anggota: {memberCode}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-[#C83030] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                TERLAMBAT {lateNumber} HARI
              </span>
              <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                STATUS: AKTIF BERSYARAT
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* INFORMASI PINJAMAN TERLAMBAT */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">INFORMASI PINJAMAN TERLAMBAT</h3>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Book Info */}
                <div className="flex gap-6 flex-1">
                  <div className="w-32 h-44 bg-slate-900 rounded-lg shrink-0 relative overflow-hidden shadow-md">
                     {/* Dummy cover for classic look */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center border-2 border-slate-700 m-2">
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-2">CLASSIC</p>
                        <h4 className="text-sm font-serif text-slate-200">{bookTitle}</h4>
                     </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-2xl font-black text-slate-800 leading-tight mb-2">{bookTitle}</h4>
                    <p className="text-sm font-medium text-slate-500 italic mb-6">Penulis: {bookAuthor}</p>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">TANGGAL PINJAM</p>
                        <p className="text-sm font-medium text-slate-700 leading-tight">{borrowDate}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">JATUH TEMPO</p>
                        <p className="text-sm font-medium text-red-500 leading-tight">{dueDate}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">DURASI KETERLAMBATAN</p>
                        <p className="text-sm font-medium text-red-500">{lateNumber}<br/>Hari</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">TARIF DENDA / HARI</p>
                        <p className="text-sm font-medium text-slate-700">Rp<br/>5.000</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Denda */}
                <div className="md:w-[220px] bg-slate-50/80 rounded-2xl p-6 flex flex-col justify-center items-center text-center shrink-0 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">TOTAL DENDA</p>
                  <p className="text-3xl font-black text-[#C83030] mb-2">{penaltyAmount}</p>
                  <p className="text-[10px] font-medium text-slate-500">*Belum termasuk biaya administrasi</p>
                </div>
              </div>
            </div>

            {/* REKAMAN RIWAYAT DENDA */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">REKAMAN RIWAYAT DENDA</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">TANGGAL</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">KETERANGAN BUKU</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">JUMLAH</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-4 text-sm font-bold text-slate-700 leading-tight">15 Des<br/>2023</td>
                      <td className="py-5 px-4 text-sm font-medium text-slate-600 max-w-[200px]">Sapiens: Riwayat Singkat Umat Manusia</td>
                      <td className="py-5 px-4 text-sm font-black text-slate-800">Rp 15.000</td>
                      <td className="py-5 px-4">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-full">LUNAS</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-4 text-sm font-bold text-slate-700 leading-tight">02 Nov<br/>2023</td>
                      <td className="py-5 px-4 text-sm font-medium text-slate-600 max-w-[200px]">Bumi Manusia</td>
                      <td className="py-5 px-4 text-sm font-black text-slate-800">Rp 25.000</td>
                      <td className="py-5 px-4">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-full">LUNAS</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* KEPUTUSAN PEMBAYARAN */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">KEPUTUSAN PEMBAYARAN</h3>
              
              <div className="space-y-4">
                {/* Bayar Sekarang */}
                <div className="border border-[#e2ebd3] rounded-2xl p-6 relative overflow-hidden bg-white">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">Bayar<br/>Sekarang</h4>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6 pr-4">
                    Proses pelunasan denda secara instan. Status anggota akan kembali menjadi &apos;Lunas&apos; dan hak peminjaman dipulihkan.
                  </p>
                  <Button 
                    onClick={() => setPaymentModalState("select")}
                    className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-black h-12 rounded-xl text-sm uppercase tracking-widest shadow-sm"
                  >
                    BAYAR DENDA
                  </Button>
                </div>

                {/* Tunda Pembayaran */}
                <div className="border border-red-100 rounded-2xl p-6 relative overflow-hidden bg-red-50/30">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">Bebaskan<br/>Denda</h4>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6 pr-4">
                    Bebaskan denda secara penuh (Waive Fine). Anggota tidak perlu membayar denda untuk peminjaman ini.
                  </p>
                  <Button 
                    onClick={() => setWarningModalState("confirm")}
                    className="w-full bg-[#991b1b] hover:bg-red-800 text-white font-black h-12 rounded-xl text-sm uppercase tracking-widest shadow-sm"
                  >
                    BEBASKAN DENDA
                  </Button>
                </div>
              </div>
            </div>

            {/* STATISTIK KEANGGOTAAN */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              {/* Shield Icon Background */}
              <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
                <svg width="80" height="96" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>

              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">STATISTIK KEANGGOTAAN</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-4xl font-black text-blue-600 mb-1">12</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TOTAL BUKU DIPINJAM</p>
                </div>
                <div>
                  <p className="text-4xl font-black text-[#99BD4A] mb-1">98%</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SKOR KEPATUHAN</p>
                </div>
                <div>
                  <p className="text-4xl font-black text-[#C83030] mb-1">3</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TOTAL PELANGGARAN</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* MODAL 1: PILIH METODE PEMBAYARAN */}
      <Dialog open={paymentModalState === "select"} onOpenChange={(open) => !open && setPaymentModalState("idle")}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-0 rounded-[20px] [&>button]:hidden">
          <div className="p-7 relative bg-slate-50">
            <button 
              onClick={() => setPaymentModalState("idle")}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 bg-emerald-100 rounded flex items-center justify-center">
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">PEMBAYARAN</p>
                <p className="text-xs font-bold text-slate-800 leading-none mt-1">Sovereign Reviewer</p>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Total Tagihan</p>
                <h3 className="text-4xl font-black text-slate-800 leading-none">{penaltyAmount}</h3>
              </div>
              <div className="text-right pb-1">
                <p className="text-[10px] font-medium text-slate-500">Order ID</p>
                <p className="text-[11px] font-bold text-[#99BD4A]">#PAY-9921-X</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">PILIH METODE PEMBAYARAN</p>
              <div className="space-y-3">
                {/* Method 1: Tunai (Cash) */}
                <div 
                  onClick={() => setSelectedMethod("cash")}
                  className={`border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === "cash" 
                      ? "border-[#99BD4A] bg-white shadow-sm opacity-100" 
                      : "border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-emerald-600">
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Tunai (Cash)</p>
                      <p className="text-[10px] text-slate-500">Bayar langsung di meja petugas</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full transition-all ${
                    selectedMethod === "cash" 
                      ? "border-[5px] border-[#99BD4A] bg-white shadow-sm" 
                      : "border-2 border-slate-300 bg-transparent"
                  }`}></div>
                </div>

                {/* Method 2: Transfer Bank Manual */}
                <div 
                  onClick={() => setSelectedMethod("transfer")}
                  className={`border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === "transfer" 
                      ? "border-[#99BD4A] bg-white shadow-sm opacity-100" 
                      : "border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-blue-600">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Transfer Manual</p>
                      <p className="text-[10px] text-slate-500">BCA, Mandiri, BNI, BRI ke rekening perpus</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full transition-all ${
                    selectedMethod === "transfer" 
                      ? "border-[5px] border-[#99BD4A] bg-white shadow-sm" 
                      : "border-2 border-slate-300 bg-transparent"
                  }`}></div>
                </div>

                {/* Method 3: DOKU Webhook Simulasi */}
                <div 
                  onClick={() => setSelectedMethod("doku_webhook")}
                  className={`border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === "doku_webhook" 
                      ? "border-[#99BD4A] bg-white shadow-sm opacity-100" 
                      : "border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-red-600">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">E-Wallet / DOKU QRIS</p>
                      <p className="text-[10px] text-slate-500">GoPay, OVO, ShopeePay (Simulasi Webhook)</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full transition-all ${
                    selectedMethod === "doku_webhook" 
                      ? "border-[5px] border-[#99BD4A] bg-white shadow-sm" 
                      : "border-2 border-slate-300 bg-transparent"
                  }`}></div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePaymentSubmit}
              disabled={isConfirming}
              className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-12 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2"
            >
              {isConfirming ? "Memproses..." : "Bayar Sekarang"} <Banknote className="w-4 h-4" />
            </Button>
            <div className="mt-5 text-center">
              <p className="text-[9px] text-slate-400 font-bold tracking-wide flex justify-center items-center gap-1">
                <span>🛡️</span> Pembayaran dienkripsi dan aman oleh DOKU
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: PEMBAYARAN BERHASIL */}
      <StatusModal
        isOpen={paymentModalState === "success"}
        onOpenChange={(open) => !open && setPaymentModalState("idle")}
        status="success"
        title="Pembayaran Berhasil"
        description={
          <div className="text-center w-full">
            <p className="mb-6">Status denda Anda telah diperbarui menjadi Lunas</p>
            <div className="bg-white rounded-xl border border-slate-100 p-4 mb-2 text-left space-y-4 shadow-sm w-full">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TRANSACTION ID</span>
                <span className="text-xs font-bold text-slate-800">TXN-LIB-9920148</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AMOUNT PAID</span>
                <span className="text-sm font-black text-[#99BD4A]">{penaltyAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STATUS</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-full">CONFIRMED</span>
              </div>
            </div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-6">
              THE SOVEREIGN LIBRARY MANAGEMENT SYSTEM • 2024
            </div>
          </div>
        }
        actionLabel="SELESAI →"
        onAction={handlePaymentComplete}
      />

      {/* MODAL 3: KONFIRMASI PERINGATAN */}
      <Dialog open={warningModalState === "confirm"} onOpenChange={(open) => !open && setWarningModalState("idle")}>
        <DialogContent className="sm:max-w-[400px] p-0 text-center border-0 rounded-[24px] [&>button]:hidden shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-b from-red-100/70 via-white to-white p-8 pb-6">
            <div className="w-16 h-16 bg-red-100/50 rounded-full mx-auto flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-[#991b1b]" strokeWidth={2.5} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-3">Bebaskan Denda?</h3>
            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed px-2">
              Dengan membebaskan denda ini, anggota tidak perlu membayar tagihan denda dan status akan kembali normal.
            </p>

            <div className="space-y-3">
              <Button 
                onClick={handleWaiveSubmit}
                disabled={isWaiving}
                className="w-full bg-[#991b1b] hover:bg-red-800 text-white font-bold h-12 rounded-xl text-sm shadow-sm"
              >
                {isWaiving ? "Memproses..." : "Ya, Bebaskan Denda"}
              </Button>
              <Button 
                onClick={() => setWarningModalState("idle")}
                variant="secondary"
                className="w-full bg-[#eef2f6] hover:bg-slate-200 text-slate-700 font-bold h-12 rounded-xl text-sm border-0"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: PERINGATAN BERHASIL */}
        <StatusModal
        isOpen={warningModalState === "success"}
        onOpenChange={(open) => !open && setWarningModalState("idle")}
        status="success"
        title="Berhasil"
        description={
          <>
            <p className="text-lg font-bold text-slate-800 mb-2">Denda Telah Dibebaskan!</p>
            <p>Denda anggota telah dibebaskan dan status peminjaman telah diperbarui.</p>
          </>
        }
        actionLabel="Tutup"
        onAction={handleWarningComplete}
      />

      {/* MODAL ERROR */}
      <Dialog open={!!errorMessage} onOpenChange={(open) => !open && setErrorMessage(null)}>
        <DialogContent className="sm:max-w-[380px] p-0 border-0 rounded-[24px] [&>button]:hidden shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-b from-red-50 via-white to-white p-8 pb-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-5">
              <X className="w-7 h-7 text-red-600" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{errorMessage}</p>
            <Button
              onClick={() => setErrorMessage(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 rounded-xl text-sm"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL INPUT INVOICE DOKU */}
      <Dialog open={dokuInvoiceModal} onOpenChange={(open) => !open && setDokuInvoiceModal(false)}>
        <DialogContent className="sm:max-w-[420px] p-0 border-0 rounded-[24px] [&>button]:hidden shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-b from-orange-50 via-white to-white p-8 pb-6">
            <div className="w-14 h-14 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-5">
              <QrCode className="w-7 h-7 text-orange-500" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-1">Simulasi Webhook DOKU</h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Masukkan Invoice Number dari transaksi DOKU yang ingin dikonfirmasi.
            </p>
            <div className="mb-5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                DOKU Invoice Number
              </label>
              <input
                type="text"
                value={dokuInvoiceInput}
                onChange={(e) => setDokuInvoiceInput(e.target.value)}
                placeholder="cth: ILMS-FINE-1-20260606210000"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-[#99BD4A] focus:outline-none placeholder:text-slate-300 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Button
                onClick={async () => {
                  if (!dokuInvoiceInput.trim()) {
                    setErrorMessage("Invoice number tidak boleh kosong.");
                    return;
                  }
                  setDokuInvoiceModal(false);
                  await processPayment("doku_webhook", dokuInvoiceInput.trim());
                }}
                className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-11 rounded-xl text-sm"
              >
                Konfirmasi Webhook
              </Button>
              <Button
                onClick={() => { setDokuInvoiceModal(false); setPaymentModalState("select"); }}
                variant="secondary"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold h-11 rounded-xl text-sm border-0"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
