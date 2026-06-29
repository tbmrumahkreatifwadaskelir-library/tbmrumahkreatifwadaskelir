"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, ChevronLeft, ChevronRight, ListOrdered, Truck, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusModal } from "@/components/ui/status-modal";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import {
  useAdminAllLoansQuery,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useAdminPendingExtensionsQuery,
  useAdminVerifyExtensionMutation,
} from "@/services/loans.service";
import { useAdminDashboardQuery } from "@/services/dashboard.service";
import { generatePagination } from "@/lib/utils";
import { format } from "date-fns";

interface Member {
  name?: string;
  member_code?: string;
  user?: {
    name?: string;
    avatar?: string;
  };
}

interface Book {
  title?: string;
  author?: string;
}

interface DeliveryPayment {
  invoice_number?: string;
  amount?: number;
  payment_url?: string;
  expires_at?: string;
  status?: string;
}

interface LoanItem {
  id: string | number;
  created_at?: string;
  loan_duration?: number;
  status: string;
  member?: Member;
  book?: Book;
  delivery_method?: string;
  delivery_payment?: DeliveryPayment | null;
}

interface ExtensionItem {
  id: string | number;
  created_at?: string;
  loan_duration?: number;
  loan?: {
    member?: Member;
    book?: Book;
  };
}

interface PaginationData {
  total: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export default function PermintaanPinjamPage() {
  const [activeTab, setActiveTab] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    id: string | number | null;
    deliveryMethod?: string;
    deliveryFee?: string;
  }>({ isOpen: false, id: null, deliveryMethod: "pickup", deliveryFee: "" });
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    id: string | number | null;
    reason: string;
  }>({
    isOpen: false,
    id: null,
    reason: "",
  });

  const [rejectExtensionModal, setRejectExtensionModal] = useState<{
    isOpen: boolean;
    id: string | number | null;
    reason: string;
  }>({
    isOpen: false,
    id: null,
    reason: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const statusFilter =
    activeTab === "semua"
      ? undefined
      : activeTab === "menunggu"
        ? "pending"
        : activeTab === "disetujui"
          ? "active"
          : "rejected";

  const {
    data: loansRes,
    isLoading: isLoadingLoans,
    refetch,
  } = useAdminAllLoansQuery({
    page: currentPage,
    per_page: itemsPerPage,
    status: statusFilter,
  });

  const { data: dashboardRes, refetch: refetchDashboard } =
    useAdminDashboardQuery();

  const [approveLoan, { isLoading: isApproving }] = useApproveLoanMutation();
  const [rejectLoan, { isLoading: isRejecting }] = useRejectLoanMutation();
  const [verifyExtension, { isLoading: isVerifyingExtension }] =
    useAdminVerifyExtensionMutation();

  const {
    data: extensionsRes,
    isLoading: isLoadingExtensions,
    refetch: refetchExtensions,
  } = useAdminPendingExtensionsQuery(undefined, {
    skip: activeTab !== "perpanjangan",
  });

  const loansResData = loansRes?.data as { loans?: LoanItem[], data?: { loans?: LoanItem[], pagination?: PaginationData }, pagination?: PaginationData } | undefined;
  const currentData: LoanItem[] =
    loansResData?.loans ||
    loansResData?.data?.loans ||
    [];

  const pagination = loansResData?.pagination ||
    loansResData?.data?.pagination || {
      total: 0,
      current_page: 1,
      last_page: 1,
      from: 0,
      to: 0,
    };

  const totalItems = activeTab === "perpanjangan" ? 0 : pagination.total;
  const totalPages = activeTab === "perpanjangan" ? 1 : pagination.last_page;

  const extensionsResData = extensionsRes?.data as { extensions?: ExtensionItem[], data?: ExtensionItem[] } | undefined;
  const currentExtensions: ExtensionItem[] =
    extensionsResData?.extensions ||
    extensionsResData?.data ||
    [];

  const dashboardResData = dashboardRes?.data as { summary?: Record<string, number>, data?: { summary?: Record<string, number> } } | undefined;
  const summary =
    dashboardResData?.summary ||
    dashboardResData?.data?.summary ||
    {};

  const confirmApprove = async () => {
    if (!approveModal.id) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { id: approveModal.id };
      if (approveModal.deliveryMethod === "delivery" && approveModal.deliveryFee) {
        payload.delivery_fee = Number(approveModal.deliveryFee);
      }
      await approveLoan(payload).unwrap();
      setApproveModal({ isOpen: false, id: null, deliveryMethod: "pickup", deliveryFee: "" });
      refetch();
      refetchDashboard();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err?.data?.message || "Gagal menyetujui peminjaman.");
    }
  };

  const confirmReject = async () => {
    if (!rejectModal.id || !rejectModal.reason.trim()) return;
    try {
      await rejectLoan({
        id: rejectModal.id,
        reason: rejectModal.reason,
      }).unwrap();
      setRejectModal({ isOpen: false, id: null, reason: "" });
      refetch();
      refetchDashboard();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err?.data?.message || "Gagal menolak peminjaman.");
    }
  };

  const confirmVerifyExtension = async (
    id: string | number,
    action: "approve" | "reject",
    reason?: string,
  ) => {
    try {
      await verifyExtension({ id, action, rejection_reason: reason }).unwrap();
      refetchExtensions();
      refetchDashboard();
      if (action === "reject") {
        setRejectExtensionModal({ isOpen: false, id: null, reason: "" });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message ||
          `Gagal ${action === "approve" ? "menyetujui" : "menolak"} perpanjangan.`,
      );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "pending") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Menunggu
        </div>
      );
    }
    if (
      status === "active" ||
      status === "completed" ||
      status === "returned"
    ) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Disetujui
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        Ditolak
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Kelola Peminjaman Anggota"
        subtitle="Pantau dan verifikasi pengajuan pinjaman buku dari anggota"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN (MAIN) ── */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Tabs + Daftar Peminjaman */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-full flex items-center">
              <div className="flex items-center gap-1 overflow-x-auto smooth-scrollbar">
                <button
                  onClick={() => {
                    setActiveTab("semua");
                    setCurrentPage(1);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === "semua"
                      ? "bg-[#99BD4A] text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Semua Permintaan
                </button>
                <button
                  onClick={() => {
                    setActiveTab("menunggu");
                    setCurrentPage(1);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === "menunggu"
                      ? "bg-[#99BD4A] text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Menunggu Persetujuan
                </button>
                <button
                  onClick={() => {
                    setActiveTab("disetujui");
                    setCurrentPage(1);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === "disetujui"
                      ? "bg-[#99BD4A] text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Disetujui
                </button>
                <button
                  onClick={() => {
                    setActiveTab("ditolak");
                    setCurrentPage(1);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === "ditolak"
                      ? "bg-[#99BD4A] text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Ditolak
                </button>
                <button
                  onClick={() => {
                    setActiveTab("perpanjangan");
                    setCurrentPage(1);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === "perpanjangan"
                      ? "bg-[#99BD4A] text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Perpanjangan
                </button>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />
                <Button
                  asChild
                  className="ml-auto bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold px-5 py-2.5 rounded-xl whitespace-nowrap gap-2 h-auto shrink-0"
                >
                  <Link href="/admin/peminjaman">
                    <ListOrdered className="w-4 h-4" />
                    Daftar Peminjaman
                  </Link>
                </Button>
              </div>
            </div>

            {/* Table */}
            <Card className="shadow-sm border-slate-100 overflow-hidden">
              <div className="overflow-x-auto smooth-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-14 pl-6">
                        PEMINJAM
                      </TableHead>
                      <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-14">
                        JUDUL BUKU
                      </TableHead>
                      <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-14">
                        REQUEST
                      </TableHead>
                      <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-14 text-center">
                        DURASI
                      </TableHead>
                      <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-14">
                        STATUS
                      </TableHead>
                      <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-14 text-right pr-6">
                        AKSI
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTab === "perpanjangan"
                      ? currentExtensions.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-slate-50/50 border-b border-slate-100/60 h-[88px]"
                          >
                            <TableCell className="pl-6 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                  <Image
                                    src={
                                      item.loan?.member?.user?.avatar ||
                                      "https://ui-avatars.com/api/?name=" +
                                        (item.loan?.member?.user?.name ||
                                          "User")
                                    }
                                    alt={
                                      item.loan?.member?.user?.name || "User"
                                    }
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {item.loan?.member?.user?.name || "-"}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium">
                                    ID: {item.loan?.member?.member_code || "-"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="font-bold text-slate-900 text-sm">
                                {item.loan?.book?.title || "-"}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium italic mt-0.5">
                                {item.loan?.book?.author || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 font-medium text-sm align-middle">
                              {item.created_at
                                ? format(
                                    new Date(item.created_at),
                                    "dd MMM yyyy",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg w-10 h-11 mx-auto">
                                <span className="font-black text-slate-800 text-sm leading-none mt-0.5">
                                  +{item.loan_duration || 7}
                                </span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                                  HARI
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Menunggu
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6 align-middle">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isVerifyingExtension}
                                  onClick={() =>
                                    confirmVerifyExtension(item.id, "approve")
                                  }
                                  className="text-[#99BD4A] border-[#99BD4A] hover:bg-[#99BD4A] hover:text-white font-bold h-8 px-4"
                                >
                                  Setujui
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isVerifyingExtension}
                                  onClick={() =>
                                    setRejectExtensionModal({
                                      isOpen: true,
                                      id: item.id,
                                      reason: "",
                                    })
                                  }
                                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-bold h-8 px-4"
                                >
                                  Tolak
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      : currentData.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-slate-50/50 border-b border-slate-100/60 h-[88px]"
                          >
                            <TableCell className="pl-6 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                  <Image
                                    src={
                                      item.member?.user?.avatar ||
                                      "https://ui-avatars.com/api/?name=" +
                                        (item.member?.name || "User")
                                    }
                                    alt={item.member?.name || "User"}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {item.member?.name || "-"}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium">
                                    ID: {item.member?.member_code || "-"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="font-bold text-slate-900 text-sm">
                                {item.book?.title || "-"}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium italic mt-0.5">
                                {item.book?.author || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 font-medium text-sm align-middle">
                              {item.created_at
                                ? format(
                                    new Date(item.created_at),
                                    "dd MMM yyyy",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg w-10 h-11 mx-auto">
                                <span className="font-black text-slate-800 text-sm leading-none mt-0.5">
                                  +{item.loan_duration || 7}
                                </span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                                  HARI
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex flex-col gap-1.5 items-start">
                                {getStatusBadge(item.status)}
                                {item.delivery_method === "delivery" && (
                                  <div className="flex flex-col gap-1.5 mt-1">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 uppercase tracking-widest border border-blue-100">
                                      <Truck className="w-3 h-3" /> PENGIRIMAN
                                    </div>
                                    {item.status !== "pending" && (
                                      (item.delivery_payment?.status?.toLowerCase() === "success" || item.delivery_payment?.status?.toLowerCase() === "paid") ? (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100">
                                          <CreditCard className="w-3 h-3" /> ONGKIR LUNAS
                                        </div>
                                      ) : (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 uppercase tracking-widest border border-amber-100">
                                          <CreditCard className="w-3 h-3" /> BELUM BAYAR ONGKIR
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6 align-middle">
                              <div className="flex items-center justify-end gap-2">
                                {item.status === "pending" ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isApproving || isRejecting}
                                      onClick={() =>
                                        setApproveModal({
                                          isOpen: true,
                                          id: item.id,
                                          deliveryMethod: item.delivery_method,
                                          deliveryFee: "",
                                        })
                                      }
                                      className="text-[#99BD4A] border-[#99BD4A] hover:bg-[#99BD4A] hover:text-white font-bold h-8 px-4"
                                    >
                                      Setujui
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isApproving || isRejecting}
                                      onClick={() =>
                                        setRejectModal({
                                          isOpen: true,
                                          id: item.id,
                                          reason: "",
                                        })
                                      }
                                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-bold h-8 px-4"
                                    >
                                      Tolak
                                    </Button>
                                  </>
                                ) : (
                                  <div className="w-[124px] text-center text-[11px] font-medium text-slate-400">
                                    Selesai
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                    {activeTab === "perpanjangan" &&
                      currentExtensions.length === 0 &&
                      !isLoadingExtensions && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-slate-500"
                          >
                            Tidak ada data permintaan perpanjangan yang
                            ditemukan.
                          </TableCell>
                        </TableRow>
                      )}
                    {activeTab !== "perpanjangan" &&
                      currentData.length === 0 &&
                      !isLoadingLoans && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-slate-500"
                          >
                            Tidak ada data permintaan pinjam yang ditemukan.
                          </TableCell>
                        </TableRow>
                      )}
                    {(isLoadingLoans || isLoadingExtensions) && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-slate-500"
                        >
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Menampilkan {totalItems === 0 ? 0 : pagination.from || 0}-
                  {pagination.to || 0} dari {totalItems || 0} data
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-slate-200"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {generatePagination(currentPage, totalPages).map(
                    (page, i) => (
                      <Button
                        key={i}
                        variant={
                          page === "..."
                            ? "ghost"
                            : currentPage === page
                              ? "default"
                              : "outline"
                        }
                        size="sm"
                        disabled={page === "..."}
                        className={`w-8 h-8 ${
                          page === "..."
                            ? "cursor-default border-none hover:bg-transparent"
                            : currentPage === page
                              ? "bg-[#99BD4A] hover:bg-[#99BD4A]/80 text-white border-none"
                              : ""
                        }`}
                        onClick={() => {
                          if (page !== "...") setCurrentPage(page as number);
                        }}
                      >
                        {page}
                      </Button>
                    ),
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-slate-200"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN (SIDEBAR) ── */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24">
            {/* Statistik Hari Ini Card */}
            <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden flex flex-col">
              <CardContent className="px-5 bg-white flex flex-col flex-1 gap-4">
                {/* Scan Buku Button */}
                <Link href="/admin/buku/scan">
                  <Button className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-12 rounded-xl text-sm gap-2 shadow-md">
                    <ScanLine className="w-4 h-4" />
                    Scan Buku
                  </Button>
                </Link>

                {/* Section Title */}
                <div className="flex items-center gap-2 pt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-[#99BD4A]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="18" y="3" width="3" height="18" />
                    <rect x="10.5" y="8" width="3" height="13" />
                    <rect x="3" y="13" width="3" height="8" />
                  </svg>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Statistik Hari Ini
                  </h3>
                </div>

                {/* STATS WRAPPER */}
                <div className="flex-1 flex flex-col gap-3">
                  {/* TOTAL REQUEST */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 flex-1 flex flex-col justify-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                      Total Request
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-black text-slate-800 leading-none">
                        {summary?.total_loans || 0}
                      </div>
                      <div className="text-xs font-bold text-emerald-500 mb-0.5"></div>
                    </div>
                  </div>

                  {/* PENDING */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50 flex-1 flex flex-col justify-center">
                    <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.15em] mb-2">
                      Pending
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-black text-amber-700 leading-none">
                        {summary?.pending_loans || 0}
                      </div>
                      <div className="text-[10px] font-bold text-amber-500 mb-0.5 uppercase tracking-widest">
                        Menunggu
                      </div>
                    </div>
                  </div>

                  {/* APPROVED */}
                  <div className="bg-[#eef5e6] rounded-2xl p-4 border border-[#d4e8ba]/50 flex-1 flex flex-col justify-center">
                    <div className="text-[10px] font-bold text-[#6a9a2e]/80 uppercase tracking-[0.15em] mb-2">
                      Approved
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-black text-[#4a7a1e] leading-none">
                        {summary?.active_loans || 0}
                      </div>
                      <div className="text-[10px] font-bold text-[#6a9a2e] mb-0.5 uppercase tracking-widest">
                        Diproses
                      </div>
                    </div>
                  </div>

                  {/* REJECTED */}
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-100/50 flex-1 flex flex-col justify-center">
                    <div className="text-[10px] font-bold text-red-500/80 uppercase tracking-[0.15em] mb-2">
                      Rejected
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-black text-red-700 leading-none">
                        {summary?.rejected_loans || 0}
                      </div>
                      <div className="text-[10px] font-bold text-red-500 mb-0.5 uppercase tracking-widest">
                        Ditolak
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Approve Modal */}
      <Dialog
        open={approveModal.isOpen}
        onOpenChange={(open) =>
          setApproveModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Peminjaman</DialogTitle>
            <DialogDescription>
              {approveModal.deliveryMethod === "delivery"
                ? "Peminjaman ini menggunakan metode pengiriman. Silakan masukkan biaya ongkos kirim (ongkir) yang harus dibayar anggota sebelum menyetujui."
                : "Apakah Anda yakin ingin menyetujui peminjaman ini?"}
            </DialogDescription>
          </DialogHeader>

          {approveModal.deliveryMethod === "delivery" && (
            <div className="py-4">
              <label className="text-sm font-bold text-slate-700 mb-2 block">
                Biaya Ongkos Kirim (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={approveModal.deliveryFee}
                  onChange={(e) =>
                    setApproveModal((prev) => ({
                      ...prev,
                      deliveryFee: e.target.value,
                    }))
                  }
                  placeholder="Contoh: 15000"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  min="0"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setApproveModal({
                  isOpen: false,
                  id: null,
                  deliveryMethod: "pickup",
                  deliveryFee: "",
                })
              }
              disabled={isApproving}
            >
              Batal
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={isApproving}
              className="bg-[#99BD4A] hover:bg-[#88ab3d] text-white"
            >
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog
        open={rejectModal.isOpen}
        onOpenChange={(open) =>
          setRejectModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Peminjaman</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan untuk peminjaman ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Alasan penolakan..."
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectModal({ isOpen: false, id: null, reason: "" })
              }
              disabled={isRejecting}
            >
              Batal
            </Button>
            <Button
              onClick={confirmReject}
              disabled={isRejecting || !rejectModal.reason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Extension Modal */}
      <Dialog
        open={rejectExtensionModal.isOpen}
        onOpenChange={(open) =>
          setRejectExtensionModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Perpanjangan</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan untuk perpanjangan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Alasan penolakan..."
              value={rejectExtensionModal.reason}
              onChange={(e) =>
                setRejectExtensionModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectExtensionModal({ isOpen: false, id: null, reason: "" })
              }
              disabled={isVerifyingExtension}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (rejectExtensionModal.id)
                  confirmVerifyExtension(
                    rejectExtensionModal.id,
                    "reject",
                    rejectExtensionModal.reason,
                  );
              }}
              disabled={
                isVerifyingExtension || !rejectExtensionModal.reason.trim()
              }
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Tolak Perpanjangan
            </Button>
          </DialogFooter>
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
    </div>
  );
}
