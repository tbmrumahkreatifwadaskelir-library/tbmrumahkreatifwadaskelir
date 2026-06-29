"use client";

import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, ChevronLeft, ChevronRight, CheckCircle2, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusModal } from "@/components/ui/status-modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAdminAllLoansQuery, useReturnLoanMutation, useUpdateDeliveryStatusMutation } from "@/services/loans.service";
import { generatePagination } from "@/lib/utils";

// Tipe data berdasarkan JSON
interface PeminjamanData {
  id: string;
  member: {
    initials: string;
    name: string;
    id: string;
    color: string;
  };
  book: {
    title: string;
    category: string;
  };
  borrowDate: string;
  status: string[];
  penalty: {
    amount: string | null;
    daysLate: string | null;
  };
  action: string;
  actionDisabled: boolean;
  isDelivery: boolean;
  deliveryStatus: string | null;
  hideUpdateStatus: boolean;
}

export default function PeminjamanPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<PeminjamanData | null>(null);
  const [selectedDeliveryRow, setSelectedDeliveryRow] = useState<PeminjamanData | null>(null);
  const [deliveryStatusInput, setDeliveryStatusInput] = useState("");
  const [deliveryNotesInput, setDeliveryNotesInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const ITEMS_PER_PAGE = 10;

  const filters = ["SEMUA", "AKTIF", "DIKEMBALIKAN", "TERLAMBAT"];

  const { data: apiData, isLoading, refetch } = useAdminAllLoansQuery({});
  const [returnLoan, { isLoading: isReturning }] = useReturnLoanMutation();
  const [updateDeliveryStatus, { isLoading: isUpdatingDelivery }] = useUpdateDeliveryStatusMutation();
  
  const rawLoans = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (apiData?.data as any)?.loans || (apiData?.data as any)?.data || [];
  }, [apiData]);

  const data: PeminjamanData[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawLoans.map((loan: any) => {
      const statusArray = [];
      if (loan.status === "active") statusArray.push("AKTIF");
      else if (loan.status === "returned" || loan.status === "completed") statusArray.push("DIKEMBALIKAN");
      else if (loan.status === "overdue") statusArray.push("TERLAMBAT");
      else if (loan.status === "pending") statusArray.push("PENDING");

      const isOverdue = loan.status === "overdue" || loan.days_late > 0;
      if (isOverdue && !statusArray.includes("TERLAMBAT")) {
        statusArray.push("TERLAMBAT");
      }

      return {
        id: String(loan.id),
        member: {
          initials: (loan.member?.name || "?").substring(0, 2).toUpperCase(),
          name: loan.member?.name || "Unknown",
          id: loan.member?.member_code || "-",
          color: "blue",
        },
        book: {
          title: loan.book?.title || "Unknown Book",
          category: loan.book?.categories?.[0]?.name || loan.book?.ddc_code || "Umum",
        },
        borrowDate: loan.loan_date ? new Date(loan.loan_date).toLocaleDateString("id-ID") : "-",
        status: statusArray,
        penalty: {
          amount: loan.fine && Number(loan.fine) > 0 ? `Rp ${Number(loan.fine).toLocaleString("id-ID")}` : null,
          daysLate: loan.days_late && loan.days_late > 0 ? `${loan.days_late} Hari` : null,
        },
        action: (loan.status === "returned" || loan.status === "completed") ? "SELESAI" : (isOverdue ? "BAYAR DENDA" : "UPDATE STATUS"),
        actionDisabled: loan.status === "returned" || loan.status === "completed",
        isDelivery: loan.delivery_method === "delivery",
        deliveryStatus: loan.delivery_status || null,
        hideUpdateStatus: loan.delivery_method === "delivery" && loan.delivery_status !== "delivered",
      };
    });
  }, [rawLoans]);

  // 1. Filter by status
  const statusFiltered = useMemo(() => {
    if (filter === "SEMUA") return data;
    return data.filter(item => item.status.includes(filter));
  }, [data, filter]);

  // 2. Filter by search (name) — tidak dibatasi pagination
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return statusFiltered;
    return statusFiltered.filter(item =>
      item.member.name.toLowerCase().includes(q) ||
      item.member.id.toLowerCase().includes(q)
    );
  }, [statusFiltered, searchQuery]);

  // 2. Logic Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeCount = rawLoans.filter((l: any) => l.status === "active" || l.status === "pending").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overdueCount = rawLoans.filter((l: any) => l.status === "overdue" || l.days_late > 0).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalFine = rawLoans.reduce((acc: number, l: any) => acc + (Number(l.fine) || 0), 0);
  const formattedFine = totalFine > 1000 ? `Rp ${(totalFine / 1000).toFixed(0)}k` : `Rp ${totalFine}`;

  const handleUpdateStatus = async () => {
    if (!selectedRow) return;
    
    try {
      await returnLoan(selectedRow.id).unwrap();
      setSelectedRow(null);
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err?.data?.message || "Gagal memperbarui status pengembalian.");
    }
  };

  const handleUpdateDelivery = async () => {
    if (!selectedDeliveryRow) return;
    if (!deliveryStatusInput) {
      setErrorMsg("Status pengiriman harus diisi.");
      return;
    }
    try {
      await updateDeliveryStatus({
        id: selectedDeliveryRow.id,
        delivery_status: deliveryStatusInput,
        admin_notes: deliveryNotesInput || undefined,
      }).unwrap();
      setSelectedDeliveryRow(null);
      setDeliveryStatusInput("");
      setDeliveryNotesInput("");
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err?.data?.message || "Gagal memperbarui status pengiriman.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader
        title="Kelola Peminjaman Anggota"
        subtitle="Pantau inventaris buku dan kelola denda administratif secara real-time."
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-12">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden flex flex-col justify-center items-start p-8">
             <h2 className="text-[56px] leading-none font-black text-blue-600 mb-2">{isLoading ? "-" : activeCount}</h2>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">PINJAMAN AKTIF</p>
          </Card>
          
          <Card className="shadow-sm border-0 bg-[#C83030] rounded-2xl overflow-hidden flex flex-col justify-center items-start p-8">
             <h2 className="text-[56px] leading-none font-black text-white mb-2">{isLoading ? "-" : overdueCount}</h2>
             <p className="text-xs font-bold text-white/80 uppercase tracking-widest">TERLAMBAT KEMBALI</p>
          </Card>

          <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden flex flex-col justify-center items-start p-8 border-l-[12px] border-l-[#99BD4A]">
             <h2 className="text-[56px] leading-none font-black text-slate-800 mb-2">{isLoading ? "-" : formattedFine}</h2>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">DENDA TERKUMPUL</p>
          </Card>
        </div>

        {/* TABLE SECTION */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">DAFTAR PINJAMAN & DENDA</h3>
            <div className="flex items-center gap-3">
              {/* SEARCH */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Cari nama anggota..."
                  className="pl-9 pr-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[11px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#99BD4A] w-44 transition-colors"
                />
              </div>
              {/* FILTER */}
              <div className="relative inline-block">
                <select 
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-4 pr-8 py-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors rounded-full text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer"
                >
                  {filters.map((f) => (
                    <option key={f} value={f}>FILTER: {f}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">MEMBER</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">DETAIL BUKU</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">TANGGAL PINJAM</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">STATUS</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">DENDA (OTOMATIS)</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm font-bold text-slate-400">
                      Memuat data peminjaman...
                    </td>
                  </tr>
                ) : currentData.length > 0 ? currentData.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                      row.status.includes('TERLAMBAT') ? 'bg-red-50/40' : 'bg-transparent'
                    }`}
                  >
                    {/* MEMBER */}
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                          row.member.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {row.member.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 mb-0.5">{row.member.name}</p>
                          <p className="text-xs font-medium text-slate-400">ID: {row.member.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* DETAIL BUKU */}
                    <td className="py-6 px-8">
                      <div className="flex flex-col items-start gap-1.5">
                        <p className="text-sm font-medium text-slate-600 leading-tight max-w-[150px]">{row.book.title}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded">
                          {row.book.category}
                        </span>
                      </div>
                    </td>

                    {/* TANGGAL PINJAM */}
                    <td className="py-6 px-8 text-sm font-medium text-slate-500">
                      <div className="max-w-[80px] leading-tight">
                        {row.borrowDate.replace(" ", "\n")}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-6 px-6">
                      <div className="flex flex-col items-start gap-1.5">
                        {row.status.map((st, idx) => {
                          if (st === "AKTIF") {
                            return <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-full">{st}</span>;
                          } else if (st === "DIKEMBALIKAN") {
                            return <span key={idx} className="px-3 py-1 bg-transparent border border-slate-800 text-slate-800 text-[9px] font-bold uppercase tracking-widest rounded-full">{st}</span>;
                          } else {
                            // Semua badge merah disamakan sesuai desain
                            return <span key={idx} className="px-3 py-1 bg-[#C83030] text-white text-[9px] font-bold uppercase tracking-widest rounded-full">{st}</span>;
                          }
                        })}
                      </div>
                    </td>

                    {/* DENDA */}
                    <td className="py-6 px-6">
                      {row.penalty.amount ? (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium text-red-600">{row.penalty.amount}</p>
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{row.penalty.daysLate}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold">-</span>
                      )}
                    </td>

                    {/* AKSI */}
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-2">
                        {(!row.hideUpdateStatus || row.action !== "UPDATE STATUS") && (
                          <button
                            disabled={row.actionDisabled}
                            onClick={() => {
                              if (row.action === "UPDATE STATUS") {
                                setSelectedRow(row);
                              } else {
                                router.push(`/admin/peminjaman/denda/${row.id}`);
                              }
                            }}
                            className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                              row.actionDisabled
                                ? "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                                : row.action === "UPDATE STATUS"
                                ? "bg-[#1e40af] hover:bg-blue-800 text-white shadow-sm"
                                : "bg-[#99BD4A] hover:bg-[#88ab3d] text-white shadow-sm"
                            }`}
                          >
                            {row.action}
                          </button>
                        )}
                        {row.isDelivery && !row.actionDisabled && (
                          <button
                            onClick={() => {
                              setSelectedDeliveryRow(row);
                              setDeliveryStatusInput(row.deliveryStatus || "processing");
                              setDeliveryNotesInput("");
                            }}
                            className="px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                          >
                            UPDATE PENGIRIMAN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-400">
                      {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}"` : "Tidak ada data yang sesuai dengan filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] font-bold text-slate-500">
              Menampilkan {currentData.length} dari {totalItems} catatan pinjaman
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border-2 border-slate-100/80 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              {generatePagination(currentPage, totalPages).map((page, idx) => {
                if (page === '...') {
                  return <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold">...</span>;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm transition-colors ${
                      currentPage === page
                        ? "bg-[#99BD4A] text-white border-none"
                        : "border-2 border-slate-100/80 bg-white text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border-2 border-slate-100/80 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: FORM */}
          <div className="lg:col-span-8">
            <div className="bg-[#eef5e0] rounded-3xl p-8 h-full flex flex-col justify-between">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-[#5c6e3b] mb-2">Input Permintaan Buku Baru</h3>
                <p className="text-sm font-medium text-[#7c8f55]">
                  Gunakan formulir ini untuk mencatat kebutuhan buku berdasarkan kategori editorial.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#5c6e3b] uppercase tracking-widest">JUDUL BUKU</label>
                    <Input 
                      placeholder="Contoh: Atomic Habits" 
                      className="bg-white/80 border-white/40 h-12 rounded-xl focus-visible:ring-[#99BD4A] text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#5c6e3b] uppercase tracking-widest">KATEGORI EDITORIAL</label>
                    <div className="relative">
                      <select className="w-full bg-white/80 border border-white/40 h-12 rounded-xl px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-[#99BD4A] text-slate-800 text-sm font-medium">
                        <option>Fiksi (Novel, Cerpen, Puisi)</option>
                        <option>Non-Fiksi</option>
                        <option>Referensi</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-black h-14 rounded-xl shadow-md text-sm uppercase tracking-widest">
                  DAFTARKAN BUKU
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT: POLICIES & ACTIVITY */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* KEBIJAKAN DENDA */}
            <div className="bg-[#f1f5eb] rounded-3xl p-6 border border-[#e2ebd3]">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-[#4b6330]" />
                <h3 className="text-xs font-black text-[#4b6330] uppercase tracking-widest">KEBIJAKAN DENDA</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm font-medium text-[#4b6330]">
                  <span className="text-xl leading-none mt-0.5">•</span>
                  Denda Rp 5.000 / hari keterlambatan.
                </li>
                <li className="flex items-start gap-2 text-sm font-medium text-[#4b6330]">
                  <span className="text-xl leading-none mt-0.5">•</span>
                  Member otomatis terblokir setelah 7 hari.
                </li>
                <li className="flex items-start gap-2 text-sm font-medium text-[#4b6330]">
                  <span className="text-xl leading-none mt-0.5">•</span>
                  Status &lsquo;Lunas&rsquo; harus diverifikasi admin.
                </li>
              </ul>
            </div>

            {/* AKTIVITAS TERAKHIR */}
            <div className="bg-white shadow-sm border border-slate-100 rounded-3xl p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">AKTIVITAS TERAKHIR</h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                
                {/* Item 1 */}
                <div className="relative flex items-center group">
                  <div className="flex items-center justify-center w-3 h-3 rounded-full border-2 border-white bg-emerald-500 shadow shrink-0 z-10 mr-4"></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">Pembayaran Denda Berhasil</h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Member: Budi Santoso &bull; Rp 25.000</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="relative flex items-center group">
                  <div className="flex items-center justify-center w-3 h-3 rounded-full border-2 border-white bg-red-500 shadow shrink-0 z-10 mr-4"></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">Peringatan Baru Terbit</h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Member: Siti Aminah &bull; Terlambat 1 Hari</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </main>

      {/* MODAL KONFIRMASI */}
      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 rounded-[20px] [&>button]:hidden">
          <div className="p-8 relative">
            <button 
              onClick={() => setSelectedRow(null)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <DialogTitle className="text-xl font-black text-slate-800 mb-1">Konfirmasi Pengembalian Buku</DialogTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                TRANSACTION ID: #RTN-{selectedRow?.id.padStart(4, '0')}
              </p>
            </div>

            <div className="bg-blue-50/50 rounded-xl p-5 mb-5 flex gap-4 border border-blue-100/50">
              <div className="w-[72px] h-[100px] bg-slate-200 rounded shrink-0 relative overflow-hidden shadow-sm">
                <Image 
                  src="/book-placeholder.jpg" 
                  alt="Book Cover" 
                  fill 
                  className="object-cover"
                  unoptimized
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">BOOK DETAILS</p>
                <h4 className="text-base font-bold text-slate-800 leading-tight mb-2">{selectedRow?.book.title}</h4>
                <p className="text-xs font-medium text-slate-500 leading-snug">Peminjam:<br/>{selectedRow?.member.name}</p>
              </div>
            </div>

            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4 mb-8 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[13px] font-medium text-emerald-800 leading-relaxed">
                Buku ini dikembalikan tepat waktu. Status akan diperbarui menjadi Dikembalikan.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleUpdateStatus}
                disabled={isReturning}
                className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-12 rounded-xl text-sm uppercase tracking-widest shadow-sm"
              >
                {isReturning ? "Memproses..." : "Update Status"}
              </Button>
              <button 
                onClick={() => setSelectedRow(null)}
                className="w-full h-10 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <StatusModal
        isOpen={!!errorMsg}
        onOpenChange={(open) => !open && setErrorMsg("")}
        status="failed"
        title="Terjadi Kesalahan"
        description={errorMsg}
        actionLabel="Tutup"
      />

      {/* MODAL UPDATE PENGIRIMAN */}
      <Dialog open={!!selectedDeliveryRow} onOpenChange={(open) => !open && setSelectedDeliveryRow(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 rounded-[20px] [&>button]:hidden">
          <div className="p-8 relative">
            <button 
              onClick={() => setSelectedDeliveryRow(null)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-6 pt-2">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Update Status Pengiriman</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Perbarui status dan catatan pengiriman buku.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Status Pengiriman</label>
                  <select
                    value={deliveryStatusInput}
                    onChange={(e) => setDeliveryStatusInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 h-12 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-medium"
                  >
                    <option value="processing">Sedang Diproses (Processing)</option>
                    <option value="shipped">Dalam Pengiriman (Shipped)</option>
                    <option value="delivered">Telah Sampai (Delivered)</option>
                    <option value="failed">Gagal (Failed)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Catatan Admin (Opsional)</label>
                  <Input 
                    value={deliveryNotesInput}
                    onChange={(e) => setDeliveryNotesInput(e.target.value)}
                    placeholder="Contoh: Resi JNE 12345678" 
                    className="bg-slate-50 border-slate-200 h-12 rounded-xl focus-visible:ring-orange-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedDeliveryRow(null)}
                  className="rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-11 px-6"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleUpdateDelivery}
                  disabled={isUpdatingDelivery}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-6 rounded-xl shadow-sm"
                >
                  {isUpdatingDelivery ? "Menyimpan..." : "Simpan Status"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
