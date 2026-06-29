"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Camera,
  CameraOff,
  CheckCircle2,
  Printer,
  User,
  Book,
  AlertCircle,
  Loader2,
  ScanBarcode,
  Check,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusModal } from "@/components/ui/status-modal";
import {
  useScanLoanMutation,
  useScanReturnMutation,
  useAdminAllLoansQuery,
  useReturnLoanMutation,
} from "@/services/loans.service";
import { useSearchBookByCodeQuery } from "@/services/books.service";

/* ─────────────────────────────────────────────────────────────────
   Barcode formats untuk scan seperti mesin kasir (1D barcodes)
───────────────────────────────────────────────────────────────── */
const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
];

/* ─────────────────────────────────────────────────────────────────
   Audio beep saat scan sukses (Web Audio API — tanpa file)
───────────────────────────────────────────────────────────────── */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    // Beep kedua (double beep seperti kasir)
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.value = 1500;
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.1);
    }, 120);
  } catch {
    // Fallback: abaikan jika Audio API tidak tersedia
  }
}

/* ─────────────────────────────────────────────────────────────────
   Helper: format tanggal ke Bahasa Indonesia
───────────────────────────────────────────────────────────────── */
function formatTgl(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/* ─────────────────────────────────────────────────────────────────
   Sub-component: Book Cover dengan fallback icon
───────────────────────────────────────────────────────────────── */
function BookCover({ src, title, className }: { src?: string; title?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#1e293b] ${className}`}>
      {src && (
        <Image
          src={src}
          alt={title || "Buku"}
          fill
          className="object-cover"
          unoptimized
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Book className="w-8 h-8 text-slate-400" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main scan content
───────────────────────────────────────────────────────────────── */
function ScanBukuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const member_code = searchParams.get("member_code");
  const memberName = searchParams.get("memberName") || "";

  const [activeTab, setActiveTab] = useState("peminjaman");
  const [currentPagePeminjaman, setCurrentPagePeminjaman] = useState(1);
  const [currentPagePengembalian, setCurrentPagePengembalian] = useState(1);
  const itemsPerPage = 10;
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showScanDetectedModal, setShowScanDetectedModal] = useState(false);
  const [showMultipleLoansDialog, setShowMultipleLoansDialog] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [multipleLoansList, setMultipleLoansList] = useState<any[]>([]);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState("");
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [cameraErrorOpen, setCameraErrorOpen] = useState(false);
  const [cameraErrorTitle, setCameraErrorTitle] = useState("Kamera Tidak Tersedia");
  const [cameraErrorMessage, setCameraErrorMessage] = useState(
    "Gagal mengakses kamera. Pastikan izin kamera telah diberikan di pengaturan browser Anda."
  );
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // ── Loan mutations ──
  const [scanLoan, { isLoading: isScanningLoan }] = useScanLoanMutation();
  const [scanReturn, { isLoading: isScanningReturn }] = useScanReturnMutation();
  const [returnLoan, { isLoading: isReturningLoan }] = useReturnLoanMutation();
  const { data: loansData, refetch } = useAdminAllLoansQuery({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLoans: any[] = (loansData?.data as any)?.loans || (loansData?.data as any)?.data || [];

  // ── Fetch buku berdasarkan book_code yang di-scan ──
  const cleanScannedCode = scannedCode.trim();
  const { data: bookSearchData, isFetching: isLoadingBook } = useSearchBookByCodeQuery(cleanScannedCode, {
    skip: !cleanScannedCode,
  });

  // Extract the list of books safely from API response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bookList: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawResponse = bookSearchData as any;
  if (rawResponse) {
    if (Array.isArray(rawResponse)) bookList = rawResponse;
    else if (Array.isArray(rawResponse.data)) bookList = rawResponse.data;
    else if (Array.isArray(rawResponse.books)) bookList = rawResponse.books;
    else if (rawResponse.data && Array.isArray(rawResponse.data.books)) bookList = rawResponse.data.books;
    else if (rawResponse.data && Array.isArray(rawResponse.data.data)) bookList = rawResponse.data.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannedBook = bookList.find((b: any) => 
    b?.book_code?.trim() === cleanScannedCode || b?.barcode?.trim() === cleanScannedCode
  ) || bookList[0] || null;

  // ── State untuk simpan hasil scan loan/return (dari API response) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastLoanResult, setLastLoanResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastReturnResult, setLastReturnResult] = useState<any>(null);

  const stateRef = useRef({ activeTab, member_code });
  useEffect(() => {
    stateRef.current = { activeTab, member_code };
  }, [activeTab, member_code]);

  /* ── Helper Error Modal ── */
  const showError = useCallback((title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setErrorModalOpen(true);
  }, []);

  /* ── Handler saat barcode terdeteksi oleh kamera ── */
  const handleBarcodeDetected = useCallback((decodedText: string) => {
    const code = decodedText.trim();
    
    // Validasi ketat untuk menghindari "false positive" (karakter aneh seperti EK%&,(&)
    // Kode buku/barcode valid biasanya hanya berisi huruf, angka, dan strip (-).
    // Jika mengandung karakter selain itu, atau terlalu pendek, abaikan dan biarkan kamera membaca lagi.
    if (!/^[a-zA-Z0-9-]+$/.test(code) || code.length < 4) {
      console.warn("Mengabaikan false-positive barcode:", code);
      return; // Jangan bunyikan beep & jangan munculkan modal, lanjut scan
    }

    const { activeTab: currentTab, member_code: currentMemberCode } = stateRef.current;

    if (currentTab === "peminjaman" && !currentMemberCode) {
      showError("Peringatan", "Silakan pilih anggota terlebih dahulu sebelum melakukan scan peminjaman!");
      return;
    }

    // Play beep & vibrate
    playBeep();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    setScannedCode(code);
    setShowScanDetectedModal(true);
  }, [showError]);

  /* ── Kamera — konfigurasi untuk barcode 1D (seperti mesin kasir) ── */
  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("barcode-reader", {
          formatsToSupport: BARCODE_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
      }
      setIsScanning(true);

      const devices = await Html5Qrcode.getCameras();
      let cameraId = devices.length > 0 ? devices[0].id : undefined;
      for (const device of devices) {
        if (device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("environment")) {
          cameraId = device.id;
          break;
        }
      }

      // Konfigurasi optimal untuk barcode 1D
      const startConfig = {
        fps: 10,
        qrbox: { width: 300, height: 100 },
        // Hapus aspectRatio agar tidak distorsi
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      if (cameraId) {
        await scannerRef.current.start(cameraId, startConfig, handleBarcodeDetected, undefined);
      } else {
        await scannerRef.current.start({ facingMode: "environment" }, startConfig, handleBarcodeDetected, undefined);
      }
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setIsScanning(false);
      const errorName = err instanceof Error ? err.name : String(err);
      if (errorName === "NotReadableError" || errorName.includes("NotReadableError")) {
        setCameraErrorTitle("Kamera Sedang Digunakan");
        setCameraErrorMessage("Kamera gagal diakses karena sedang digunakan oleh aplikasi lain (misal: Zoom, OBS, tab browser lain).");
      } else {
        setCameraErrorTitle("Kamera Tidak Tersedia");
        setCameraErrorMessage("Gagal mengakses kamera. Pastikan izin kamera telah diberikan atau perangkat ini memiliki kamera.");
      }
      setCameraErrorOpen(true);
    }
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState ? scannerRef.current.getState() : 2;
        if (state === 2) await scannerRef.current.stop();
      } catch { /* abaikan */ }
      finally { setIsScanning(false); }
    }
  }, []);

  // Stop scanner saat barcode terdeteksi (via modal)
  useEffect(() => {
    if (showScanDetectedModal && isScanning) {
      stopScanner();
    }
  }, [showScanDetectedModal, isScanning, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState ? scannerRef.current.getState() : 2;
          if (state === 2) scannerRef.current.stop().catch(() => {});
        } catch { /* abaikan */ }
      }
    };
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      if (activeTab === "peminjaman" && !member_code) {
        showError("Peringatan", "Silakan pilih anggota terlebih dahulu sebelum memasukkan kode peminjaman!");
        return;
      }

      playBeep();
      setScannedCode(manualCode.trim());
      setShowScanDetectedModal(true);
    }
  };

  /* ── Konfirmasi Peminjaman ── */
  const handleConfirmPeminjaman = async () => {
    if (!scannedCode) { showError("Peringatan", "Silakan scan buku terlebih dahulu!"); return; }
    if (!member_code) { showError("Peringatan", "Silakan pilih anggota terlebih dahulu!"); return; }
    try {
      const result = await scanLoan({ book_code: scannedCode, member_code }).unwrap();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLastLoanResult((result?.data as any) ?? result);
      refetch();
      setShowSuccessModal(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      let msg = err?.data?.message || "Gagal mengkonfirmasi peminjaman.";
      if (msg.toLowerCase().includes("csrf")) {
        msg = "Sesi keamanan (CSRF) telah kedaluwarsa. Silakan refresh halaman (F5) dan coba lagi.";
      }
      showError("Gagal Meminjam", msg);
    }
  };

  /* ── Eksekusi Pengembalian Loan Spesifik ── */
  const handleReturnSpecificLoan = async (loanId: string | number) => {
    try {
      const result = await returnLoan(loanId).unwrap();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLastReturnResult((result?.data as any) ?? result);
      refetch();
      setShowMultipleLoansDialog(false);
      setShowScanDetectedModal(false);
      setShowSuccessModal(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.data?.message || "Gagal memproses pengembalian untuk anggota ini.";
      showError("Gagal Mengembalikan", msg);
    }
  };

  /* ── Konfirmasi Pengembalian ── */
  const handleConfirmPengembalian = async () => {
    if (!scannedCode) { showError("Peringatan", "Silakan scan buku terlebih dahulu!"); return; }
    try {
      const result = await scanReturn({ book_code: scannedCode }).unwrap();
      
      // Cek apakah ada multiple peminjaman aktif untuk buku ini
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (result?.data as any) ?? result;
      if (data?.multiple_loans === true) {
        setMultipleLoansList(data.loans || []);
        setShowMultipleLoansDialog(true);
        return;
      }

      setLastReturnResult(data);
      refetch();
      setShowSuccessModal(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      let msg = err?.data?.message || "Gagal mengembalikan buku.";
      if (msg.toLowerCase().includes("csrf")) {
        msg = "Sesi keamanan (CSRF) telah kedaluwarsa. Silakan refresh halaman (F5) dan coba lagi.";
      }
      showError("Gagal Mengembalikan", msg);
    }
  };

  const printReceipt = () => window.print();

  // Cari semua active loan untuk buku yang sedang di-scan (buku fisik bisa dipinjam ganda jika ada multiple copies)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchingActiveLoans = allLoans.filter((l: any) => 
    (l?.book?.book_code?.trim() === cleanScannedCode || 
     l?.book?.barcode?.trim() === cleanScannedCode || 
     l?.book?.isbn?.trim() === cleanScannedCode) && 
    (l.status === 'active' || l.status === 'overdue' || l.status === 'SEDANG_DIPINJAM')
  );

  const hasMultipleLoans = !lastReturnResult && matchingActiveLoans.length > 1;
  const activeLoan = matchingActiveLoans[0] || null;

  const loanForReturn = lastReturnResult ? { ...activeLoan, ...lastReturnResult, member: lastReturnResult.member || activeLoan?.member, book: lastReturnResult.book || activeLoan?.book } : activeLoan;

  /* ── Fungsi reset ── */
  const resetAll = () => {
    setScannedCode("");
    setManualCode("");
    setLastLoanResult(null);
    setLastReturnResult(null);
    setShowScanDetectedModal(false);
    setShowSuccessModal(false);
    setCurrentPagePeminjaman(1);
    setCurrentPagePengembalian(1);
  };

  return (
    <>
    <div className="min-h-screen flex flex-col bg-slate-50/50 print:hidden">
      <SiteHeader
        title="Pengelolaan Buku di Perpustakaan"
        subtitle="Manajemen untuk mengatur buku di perpustakaan"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Tab Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Scan Buku</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Kelola sirkulasi buku dengan pemindaian barcode cepat.
            </p>
          </div>
          <div className="flex w-full sm:w-auto bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            <button
              onClick={() => { setActiveTab("peminjaman"); resetAll(); }}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === "peminjaman"
                  ? "bg-white shadow border border-slate-100 text-[#99BD4A]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Peminjaman
            </button>
            <button
              onClick={() => { setActiveTab("pengembalian"); resetAll(); }}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === "pengembalian"
                  ? "bg-white shadow border border-slate-100 text-[#99BD4A]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Pengembalian
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* ── LEFT: SCANNER ── */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <ScanBarcode className="w-4 h-4" />
                    Pemindai Barcode
                  </div>
                  {isScanning && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full animate-pulse">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">LIVE</span>
                    </div>
                  )}
                </div>

                {/* Camera viewport */}
                <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center mb-6">
                  <div
                    id="barcode-reader"
                    className="w-full h-full"
                    style={{ display: isScanning ? "block" : "none" }}
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-3">
                      <CameraOff className="w-12 h-12" />
                      <p className="text-sm font-medium">Kamera tidak aktif</p>
                      <p className="text-xs text-white/30">Klik &quot;Mulai Scan&quot; untuk mengaktifkan</p>
                    </div>
                  )}
                  {/* Scan guide overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                      <div className="w-[80%] max-w-[400px] h-[35%] max-h-[150px] border-2 border-[#99BD4A] rounded-lg relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#99BD4A] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                          Arahkan barcode ke area ini
                        </div>
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#99BD4A]" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#99BD4A]" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#99BD4A]" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#99BD4A]" />
                        {/* Scanning line animation */}
                        <div className="absolute top-0 left-2 right-2 h-0.5 bg-[#99BD4A] animate-[scanline_2s_ease-in-out_infinite]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Button
                    onClick={startScanner}
                    disabled={isScanning}
                    className="bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-12 rounded-xl shadow-sm gap-2"
                  >
                    <Camera className="w-5 h-5" /> Mulai Scan
                  </Button>
                  <Button
                    onClick={stopScanner}
                    disabled={!isScanning}
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-12 rounded-xl gap-2"
                  >
                    <CameraOff className="w-5 h-5" /> Hentikan Scan
                  </Button>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Atau Input Manual</span>
                  </div>
                </div>

                <form onSubmit={handleManualSearch} className="flex gap-3 mt-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Masukkan Kode Buku (book_code)..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus-visible:ring-[#99BD4A]"
                    />
                  </div>
                  <Button type="submit" className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-xl">
                    <Search className="w-4 h-4 mr-2" /> Cari
                  </Button>
                </form>

                {/* Kode hasil scan */}
                {scannedCode && !showScanDetectedModal && (
                  <div className="mt-4 flex items-center justify-between bg-[#f4f7ef] rounded-xl px-4 py-3 border border-[#d4e6a0]">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#99BD4A]" />
                      <div>
                        <p className="text-[10px] font-bold text-[#99BD4A] uppercase tracking-wider mb-0.5">Kode Terdeteksi</p>
                        <p className="text-sm font-black text-slate-800 font-mono">{scannedCode}</p>
                      </div>
                    </div>
                    <button
                      onClick={resetAll}
                      className="text-slate-400 hover:text-red-500 transition-colors text-xs font-bold"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pengembalian: info buku */}
            {activeTab === "pengembalian" && scannedCode && !showScanDetectedModal && (
              <Card className="shadow-sm border-slate-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                <BookCover
                  src={scannedBook?.cover_url}
                  title={scannedBook?.title}
                  className="w-32 h-44 rounded-xl shrink-0 shadow-sm border border-slate-100"
                />
                <div className="flex flex-col justify-center flex-1">
                  {isLoadingBook ? (
                    <div className="flex items-center gap-3 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Memuat data buku...</span>
                    </div>
                  ) : scannedBook ? (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-black text-slate-800 mb-1">{scannedBook.title}</h3>
                          <p className="text-xs font-bold text-slate-400">Kode: {scannedBook.book_code || scannedCode}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        </div>
                      </div>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                          <User className="w-4 h-4 text-slate-400" /> {scannedBook.author || "-"}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                          <Book className="w-4 h-4 text-slate-400" /> {scannedBook.categories?.map((c: { name?: string }) => c.name).join(", ") || scannedBook.ddc_code || "-"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Buku dengan kode &quot;{scannedCode}&quot; tidak ditemukan.</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* ── RIGHT: INFO PANEL ── */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            {activeTab === "peminjaman" ? (
              <>
                {/* INFO BUKU */}
                <Card className="shadow-sm border-slate-100 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                      <Book className="w-4 h-4" /> Informasi Buku
                    </div>
                    {scannedCode ? (
                      isLoadingBook ? (
                        <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin text-[#99BD4A]" />
                          <span className="text-sm font-medium">Memuat data buku...</span>
                        </div>
                      ) : scannedBook ? (
                        <div className="flex gap-4">
                          <BookCover src={scannedBook.cover_url} title={scannedBook.title} className="w-24 h-32 rounded-lg shrink-0 border border-slate-200" />
                          <div>
                            <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{scannedBook.title}</h3>
                            <p className="text-sm font-medium text-[#99BD4A] mb-2">{scannedBook.author}</p>
                            <p className="text-[11px] font-bold text-slate-400 mb-3">Kode: {scannedBook.book_code || scannedCode}</p>
                            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold">
                              Stok: {scannedBook.available_copies ?? scannedBook.total_copies ?? "-"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 py-4 text-slate-400">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <span className="text-sm font-medium">Buku tidak ditemukan untuk kode &quot;{scannedCode}&quot;</span>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-6 text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">
                        Belum ada buku yang di-scan
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* INFO ANGGOTA + KONFIRMASI */}
                <Card className="shadow-sm border-slate-100 rounded-2xl flex-1 flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                      <User className="w-4 h-4" /> Informasi Anggota
                    </div>
                    {member_code ? (
                      <Link href="/admin/anggota/pengelolaan" className="block group">
                        <div className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 mb-6">
                          <div className="w-14 h-14 rounded-full bg-[#99BD4A]/20 shrink-0 border border-[#99BD4A]/30 flex items-center justify-center">
                            <span className="text-[#99BD4A] font-bold text-lg">{memberName ? memberName.substring(0, 2).toUpperCase() : "?"}</span>
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-800 mb-0.5 group-hover:text-[#99BD4A] transition-colors">{memberName || "Anggota"}</h3>
                            <p className="text-xs font-medium text-slate-500 mb-1.5">ID: {member_code}</p>
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider">Aktif</div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="mb-6">
                        <Link href="/admin/anggota/pengelolaan">
                          <Button variant="outline" className="w-full h-14 border-dashed border-2 border-slate-200 text-slate-500 hover:text-[#99BD4A] hover:border-[#99BD4A] hover:bg-[#99BD4A]/5 rounded-xl font-bold">
                            + Pilih Anggota
                          </Button>
                        </Link>
                      </div>
                    )}
                    <div className="mt-auto">
                      <Button
                        onClick={handleConfirmPeminjaman}
                        disabled={isScanningLoan || !scannedCode || !member_code}
                        className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-14 rounded-xl shadow-md text-base disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        {isScanningLoan ? "Memproses..." : "Konfirmasi Peminjaman"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* ── TAB PENGEMBALIAN ── */
              <>
                {scannedCode ? (
                  <>
                    {hasMultipleLoans ? (
                      <Card className="shadow-sm border-amber-200 bg-amber-50/30 rounded-2xl flex-1 flex flex-col justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-amber-100 mx-auto mb-4">
                          <AlertCircle className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">Peminjaman Ganda Terdeteksi</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-[280px] mx-auto mb-4">
                          Ditemukan {matchingActiveLoans.length} transaksi peminjaman aktif untuk kode buku ini. Silakan klik tombol di bawah untuk memilih peminjam.
                        </p>
                      </Card>
                    ) : (
                      <>
                        <Card className="shadow-sm border-slate-100 rounded-2xl">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
                              <User className="w-4 h-4" /> Informasi Peminjam
                            </div>
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-14 h-14 rounded-full bg-[#99BD4A]/20 shrink-0 border border-[#99BD4A]/30 flex items-center justify-center">
                                <span className="text-[#99BD4A] font-bold text-lg">{(loanForReturn?.member?.name || memberName || "?").substring(0, 2).toUpperCase()}</span>
                              </div>
                              <div>
                                <h3 className="text-base font-black text-slate-800 mb-0.5">{loanForReturn?.member?.name || memberName || "Peminjam"}</h3>
                                <p className="text-xs font-medium text-slate-500">ID: {loanForReturn?.member?.member_code || member_code || "-"}</p>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tgl Peminjaman</span>
                                <span className="text-sm font-black text-slate-800">{formatTgl(loanForReturn?.loan_date || loanForReturn?.created_at)}</span>
                              </div>
                              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tgl Jatuh Tempo</span>
                                <span className="text-sm font-black text-slate-800">{formatTgl(loanForReturn?.due_date)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tgl Kembali</span>
                                <span className="text-sm font-black text-slate-800">{formatTgl(loanForReturn?.return_date || loanForReturn?.returned_at || lastReturnResult?.returned_at || new Date().toISOString())}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {loanForReturn?.is_overdue ? (
                          <Card className="shadow-sm border-red-200/60 bg-red-50/50 rounded-2xl flex-1 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl -z-10 opacity-50" />
                            <CardContent className="p-6 flex flex-col flex-1">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">STATUS PENGEMBALIAN</div>
                                <AlertCircle className="w-5 h-5 text-red-500" />
                              </div>
                              <h3 className="text-xl font-black text-red-600 mb-6">TERLAMBAT ({loanForReturn?.overdue_days ?? "-"} HARI)</h3>
                              <div className="bg-white rounded-xl p-4 border border-red-100 mt-auto flex items-center justify-between shadow-sm">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DENDA KETERLAMBATAN</p>
                                  <p className="text-2xl font-black text-red-500">{loanForReturn?.fine ? `Rp ${Number(loanForReturn.fine).toLocaleString("id-ID")}` : "-"}</p>
                                </div>
                                <div className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded border border-red-100">UNPAID</div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="shadow-sm border-emerald-200/60 bg-emerald-50/50 rounded-2xl flex-1 flex flex-col">
                            <CardContent className="p-6 flex flex-col flex-1">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">STATUS PENGEMBALIAN</div>
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              </div>
                              <h3 className="text-xl font-black text-emerald-600 mb-2">TEPAT WAKTU</h3>
                              <p className="text-sm text-slate-500 font-medium">Tidak ada denda keterlambatan.</p>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}

                    <Button
                      onClick={handleConfirmPengembalian}
                      disabled={isScanningReturn}
                      className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-14 rounded-xl shadow-md text-base"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {isScanningReturn ? "Memproses..." : hasMultipleLoans ? "Pilih Peminjam Buku" : "Konfirmasi Pengembalian"}
                    </Button>
                  </>
                ) : (
                  <Card className="shadow-sm border-slate-100 rounded-2xl flex-1 flex flex-col justify-center items-center p-8 text-center bg-slate-50/30">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                      <Book className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">Menunggu Scan Buku</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-[250px]">Silakan mulai scan barcode buku atau masukkan kode buku secara manual.</p>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── BOTTOM TABLE ── */}
        {activeTab === "peminjaman" ? (
          <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-black text-slate-800">Riwayat Scan Hari Ini</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Memantau transaksi peminjaman terbaru.</p>
              </div>
              <Link href="/admin/peminjaman">
                <Button variant="link" className="text-[#99BD4A] font-bold">Lihat Semua</Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">NO</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">WAKTU</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">KODE BUKU</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">JUDUL</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ANGGOTA</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {(() => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const todayLoans = allLoans.filter((l: any) => {
                      const loanCreated = l.created_at || l.loan_date || "";
                      return loanCreated.startsWith(todayStr);
                    });
                    if (todayLoans.length === 0) {
                      return (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">Belum ada transaksi hari ini.</td></tr>
                      );
                    }
                    const startIndex = (currentPagePeminjaman - 1) * itemsPerPage;
                    const paginatedLoans = todayLoans.slice(startIndex, startIndex + itemsPerPage);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return paginatedLoans.map((loan: any, index: number) => (
                      <tr key={loan.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-bold text-slate-800">{String(startIndex + index + 1).padStart(2, "0")}</td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-600">{loan.created_at ? new Date(loan.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-500 font-mono">{loan.book?.book_code || "-"}</td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-800">{loan.book?.title || "-"}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#99BD4A]/20 flex items-center justify-center text-[10px] font-bold text-[#99BD4A]">{(loan.member?.name || "?").substring(0, 2).toUpperCase()}</div>
                            <span className="text-sm font-medium text-slate-600">{loan.member?.name || "-"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            loan.status === "returned" ? "bg-blue-50 text-blue-600"
                              : loan.status === "active" ? "bg-emerald-50 text-emerald-600"
                                : loan.status === "pending" ? "bg-amber-50 text-amber-600"
                                  : loan.status === "overdue" ? "bg-red-50 text-red-600"
                                    : "bg-slate-50 text-slate-600"
                          }`}>
                            {loan.status === "returned" ? "Dikembalikan"
                              : loan.status === "active" ? "Dipinjam"
                                : loan.status === "pending" ? "Pending"
                                  : loan.status === "overdue" ? "Terlambat"
                                    : loan.status || "-"}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              {(() => {
                const todayStr = new Date().toISOString().split("T")[0];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const todayLoans = allLoans.filter((l: any) => {
                  const loanCreated = l.created_at || l.loan_date || "";
                  return loanCreated.startsWith(todayStr);
                });
                const totalPages = Math.ceil(todayLoans.length / itemsPerPage);
                if (totalPages > 1) {
                  return (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
                      <span className="text-sm text-slate-500">Halaman {currentPagePeminjaman} dari {totalPages}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPagePeminjaman(p => Math.max(1, p - 1))} disabled={currentPagePeminjaman === 1}>Sebelumnya</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPagePeminjaman(p => Math.min(totalPages, p + 1))} disabled={currentPagePeminjaman === totalPages}>Selanjutnya</Button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </Card>
        ) : (
          <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-black text-slate-800">Pengembalian Terakhir</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Daftar buku yang baru saja dikembalikan.</p>
              </div>
              <Link href="/admin/peminjaman">
                <Button variant="link" className="text-[#99BD4A] font-bold">Lihat Semua</Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">JUDUL BUKU</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">PEMINJAM</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">WAKTU KEMBALI</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {(() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const returnedLoans = allLoans.filter((l: any) => l.status === "returned");
                    if (returnedLoans.length === 0) {
                      return (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Tidak ada riwayat pengembalian.</td></tr>
                      );
                    }
                    const startIndex = (currentPagePengembalian - 1) * itemsPerPage;
                    const paginatedLoans = returnedLoans.slice(startIndex, startIndex + itemsPerPage);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return paginatedLoans.map((loan: any) => (
                      <tr key={loan.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-bold text-slate-800">{loan.book?.title || "-"}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#99BD4A]/20 flex items-center justify-center text-[10px] font-bold text-[#99BD4A]">{(loan.member?.name || "?").substring(0, 2).toUpperCase()}</div>
                            <span className="text-sm font-medium text-slate-600">{loan.member?.name || "-"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-500">
                          {loan.return_date ? new Date(loan.return_date).toLocaleDateString("id-ID") + ", " + (loan.updated_at ? new Date(loan.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "") : "-"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${loan.days_late > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                            {loan.days_late > 0 ? `Terlambat ${loan.days_late} hari` : "Tepat Waktu"}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              {(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const returnedLoans = allLoans.filter((l: any) => l.status === "returned");
                const totalPages = Math.ceil(returnedLoans.length / itemsPerPage);
                if (totalPages > 1) {
                  return (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
                      <span className="text-sm text-slate-500">Halaman {currentPagePengembalian} dari {totalPages}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPagePengembalian(p => Math.max(1, p - 1))} disabled={currentPagePengembalian === 1}>Sebelumnya</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPagePengembalian(p => Math.min(totalPages, p + 1))} disabled={currentPagePengembalian === totalPages}>Selanjutnya</Button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </Card>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 1: SCAN TERDETEKSI (muncul saat barcode berhasil di-scan)
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={showScanDetectedModal} onOpenChange={setShowScanDetectedModal}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border-0 rounded-2xl">
          {/* Animated header */}
          <div className="bg-gradient-to-br from-[#99BD4A] to-[#7fa33d] p-6 text-center relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />

            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-[bounceIn_0.5s_ease-out]">
              <ScanBarcode className="w-8 h-8 text-[#99BD4A]" />
            </div>
            <DialogTitle className="text-xl font-black text-white mb-1">Barcode Terdeteksi!</DialogTitle>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">SCAN BERHASIL</p>
          </div>

          <div className="p-6">
            {/* Kode barcode */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">KODE BARCODE</p>
              <p className="text-lg font-black text-slate-800 font-mono tracking-wide">{scannedCode}</p>
            </div>

            {/* Data buku yang ditemukan */}
            {isLoadingBook ? (
              <div className="flex items-center justify-center py-6 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#99BD4A]" />
                <span className="text-sm font-medium">Mencari data buku...</span>
              </div>
            ) : scannedBook ? (
              <div className="flex gap-4 p-4 rounded-xl border border-[#d4e6a0] bg-[#f4f7ef]/50 mb-5">
                <BookCover src={scannedBook.cover_url} title={scannedBook.title} className="w-14 h-20 rounded-lg shrink-0" />
                <div className="flex flex-col justify-center min-w-0">
                  <h4 className="text-sm font-black text-slate-800 leading-tight mb-0.5 break-words">{scannedBook.title}</h4>
                  <p className="text-xs font-medium text-[#99BD4A] mb-1 break-words">{scannedBook.author}</p>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 w-fit">
                    Stok: {scannedBook.available_copies ?? scannedBook.total_copies ?? "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-4 px-4 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-amber-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Buku tidak ditemukan di database.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScanDetectedModal(false);
                  setScannedCode("");
                  setManualCode("");
                }}
                className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Scan Ulang
              </Button>
              <Button
                onClick={() => setShowScanDetectedModal(false)}
                disabled={!scannedBook}
                className="flex-1 h-12 rounded-xl font-bold bg-[#99BD4A] hover:bg-[#88ab3d] text-white disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Gunakan Kode Ini
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 2: TRANSAKSI BERHASIL (setelah konfirmasi loan/return)
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0 rounded-2xl">
          {/* ── TAMPILAN MODAL SUKSES ── */}
          <div className="bg-[#99BD4A] p-8 text-center relative">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-[#99BD4A]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white mb-2">
              {activeTab === "peminjaman" ? "Peminjaman Berhasil!" : "Pengembalian Berhasil!"}
            </DialogTitle>
            <p className="text-white/90 text-xs font-bold uppercase tracking-widest">TRANSAKSI TERVERIFIKASI SISTEM</p>
          </div>

          <div className="p-8 pb-6">
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 mb-6 border border-slate-100">
              <BookCover src={scannedBook?.cover_url} title={scannedBook?.title} className="w-16 h-20 rounded shrink-0" />
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">INFORMASI BUKU</p>
                <h4 className="text-base font-black text-slate-800 leading-tight mb-1">{scannedBook?.title || scannedCode}</h4>
                <p className="text-xs font-medium text-slate-500">{scannedBook?.author || "-"}</p>
                <p className="text-xs font-medium text-slate-400 font-mono mt-0.5">Kode: {scannedCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">PEMINJAM</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#99BD4A] rounded-full flex items-center justify-center text-[10px] font-bold text-white">{((activeTab === "pengembalian" ? loanForReturn?.member?.name : memberName) || "?").substring(0, 2).toUpperCase()}</div>
                  <span className="text-sm font-bold text-slate-800">{(activeTab === "pengembalian" ? loanForReturn?.member?.name : memberName) || "-"}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {activeTab === "peminjaman" ? "TANGGAL KEMBALI" : "TANGGAL DIKEMBALIKAN"}
                </p>
                <span className="text-sm font-black text-slate-800">
                  {activeTab === "peminjaman" ? formatTgl(lastLoanResult?.due_date) : formatTgl(lastReturnResult?.returned_at || new Date().toISOString())}
                </span>
              </div>
            </div>

            {(lastLoanResult?.id || lastReturnResult?.id) && (
              <div className="text-center mb-4">
                <span className="text-xs font-mono text-slate-400">No. Transaksi: #{lastLoanResult?.id || lastReturnResult?.id}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetAll();
                  if (activeTab === "peminjaman") router.push("/admin/buku/scan");
                }}
                className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                SELESAI
              </Button>
              <Button onClick={printReceipt} className="flex-1 h-12 rounded-xl font-bold bg-[#99BD4A] hover:bg-[#88ab3d] text-white">
                <Printer className="w-4 h-4 mr-2" /> CETAK STRUK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <StatusModal
        isOpen={cameraErrorOpen}
        onOpenChange={setCameraErrorOpen}
        status="failed"
        title={cameraErrorTitle}
        description={cameraErrorMessage}
        actionLabel="Mengerti"
      />

      <StatusModal
        isOpen={errorModalOpen}
        onOpenChange={setErrorModalOpen}
        status="failed"
        title={errorModalTitle}
        description={errorModalMessage}
        actionLabel="Tutup"
      />

      {/* ── MODAL: MULTIPLE LOANS SELECTION ── */}
      <Dialog open={showMultipleLoansDialog} onOpenChange={setShowMultipleLoansDialog}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto p-6 md:p-8 bg-white border border-slate-100 rounded-3xl shadow-2xl">
          <div className="flex flex-col gap-4">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                Pilih Peminjam Buku
              </DialogTitle>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Buku ini terdeteksi sedang dipinjam oleh beberapa anggota sekaligus. 
                Silakan pilih salah satu anggota di bawah ini yang mengembalikan buku tersebut.
              </p>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {multipleLoansList.map((loan) => {
                const isOverdue = loan.status === "overdue" || loan.days_late > 0;
                
                return (
                  <div 
                    key={loan.id} 
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f4f7f4] flex items-center justify-center font-bold text-[#99BD4A] text-sm shrink-0 border border-[#99BD4A]/10">
                        {loan.member?.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{loan.member?.name || "Nama Anggota"}</h4>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">Kode Anggota: {loan.member?.member_code || "-"}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                            Pinjam: {formatTgl(loan.loan_date)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isOverdue 
                              ? "bg-red-50 text-red-600" 
                              : "bg-[#f4f7f4] text-[#99BD4A]"
                          }`}>
                            Jatuh Tempo: {formatTgl(loan.due_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleReturnSpecificLoan(loan.id)}
                      disabled={isReturningLoan}
                      className="bg-[#99BD4A] hover:bg-[#85a440] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      {isReturningLoan ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {isReturningLoan ? "Memproses..." : "Pilih & Kembalikan"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS animasi scanline */}
      <style jsx>{`
        @keyframes scanline {
          0%, 100% { top: 5%; }
          50% { top: 90%; }
        }
      `}</style>

      {/* Scoped print styles for receipt */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 74mm auto;
            margin: 0;
          }
          * {
            visibility: hidden !important;
          }
          #print-receipt-area,
          #print-receipt-area * {
            visibility: visible !important;
          }
          #print-receipt-area {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 74mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-sizing: border-box !important;
            background: white !important;
            font-family: Arial, sans-serif !important;
            font-size: 9pt !important;
            color: #000 !important;
          }
        }
      `}} />
    </div>

    {/* ── STRUK CETAK (di luar print:hidden, tampil hanya saat print) ── */}
    {showSuccessModal && (
      <div
        id="print-receipt-area"
        style={{
          display: 'none',
          width: '74mm',
          boxSizing: 'border-box',
          padding: '4mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '9pt',
          color: '#000',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '8px' }}>
          <div style={{ fontWeight: 900, fontSize: '10pt', textTransform: 'uppercase', marginBottom: '2px' }}>
            TBM RUMAH KREATIF WADAS KELIR
          </div>
          <div style={{ fontSize: '7.5pt', color: '#555' }}>Taman Bacaan Masyarakat Wadas Kelir</div>
          <div style={{ fontWeight: 700, fontSize: '9pt', textTransform: 'uppercase', marginTop: '4px' }}>
            BUKTI {activeTab === 'peminjaman' ? 'PEMINJAMAN' : 'PENGEMBALIAN'}
          </div>
        </div>

        {/* Meta info */}
        <div style={{ marginBottom: '8px', fontSize: '8pt' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Tanggal:</span>
            <span style={{ fontWeight: 700 }}>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>No. Transaksi:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{lastLoanResult?.id || lastReturnResult?.id || '-'}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #999', marginBottom: '8px' }} />

        {/* Data Anggota */}
        <div style={{ marginBottom: '6px', fontSize: '8pt' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7pt', color: '#555', marginBottom: '3px' }}>Data Anggota</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>ID</span>
            <span style={{ fontWeight: 700 }}>{activeTab === 'peminjaman' ? member_code : (loanForReturn?.member?.member_code || member_code || '-')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Nama</span>
            <span style={{ fontWeight: 700, textAlign: 'right', maxWidth: '50mm' }}>{activeTab === 'peminjaman' ? memberName : (loanForReturn?.member?.name || memberName || '-')}</span>
          </div>
        </div>

        {/* Data Buku */}
        <div style={{ marginBottom: '6px', fontSize: '8pt' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7pt', color: '#555', marginBottom: '3px' }}>Data Buku</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Kode</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{scannedCode}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ color: '#666', whiteSpace: 'nowrap' }}>Judul</span>
            <span style={{ fontWeight: 700, textAlign: 'right' }}>{scannedBook?.title || '-'}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #999', marginBottom: '8px' }} />

        {/* Rincian Transaksi */}
        <div style={{ marginBottom: '10px', fontSize: '8pt' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7pt', color: '#555', marginBottom: '4px' }}>Rincian Transaksi</div>
          {activeTab === 'peminjaman' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Tanggal Pinjam</span>
                <span style={{ fontWeight: 700 }}>{formatTgl(new Date().toISOString())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Batas Kembali</span>
                <span style={{ fontWeight: 700 }}>{formatTgl(lastLoanResult?.due_date)}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Tanggal Pinjam</span>
                <span style={{ fontWeight: 700 }}>{formatTgl(loanForReturn?.loan_date || loanForReturn?.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Batas Kembali</span>
                <span style={{ fontWeight: 700 }}>{formatTgl(loanForReturn?.due_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Waktu Kembali</span>
                <span style={{ fontWeight: 700, color: loanForReturn?.is_overdue ? 'red' : 'green' }}>
                  {loanForReturn?.is_overdue ? `Terlambat ${loanForReturn?.overdue_days} hari` : 'Tepat Waktu'}
                </span>
              </div>
              {loanForReturn?.is_overdue && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 900 }}>DENDA</span>
                  <span style={{ fontWeight: 900, color: 'red' }}>Rp {Number(loanForReturn?.fine || 0).toLocaleString('id-ID')}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #999', marginBottom: '8px' }} />

        {/* Footer */}
        <div style={{ fontSize: '7.5pt', textAlign: 'center', color: '#555', marginTop: '6px' }}>
          <div style={{ marginBottom: '12px' }}>Terima kasih, harap simpan tanda terima ini.</div>
          <div style={{ fontFamily: 'monospace', letterSpacing: '0.15em', fontWeight: 700 }}>*{lastLoanResult?.id || lastReturnResult?.id || '000000'}*</div>
        </div>
      </div>
    )}
    </>
  );
}

export default function ScanBukuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ScanBukuContent />
    </Suspense>
  );
}
