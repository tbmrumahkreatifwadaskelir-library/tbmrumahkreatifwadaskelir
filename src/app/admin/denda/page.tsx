"use client";

import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusModal } from "@/components/ui/status-modal";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw,
  Banknote, ShieldOff, QrCode, Landmark, History,
  TrendingUp, AlertCircle, CheckCircle2, X, Filter,
  Webhook, Clock, CreditCard, Eye,
} from "lucide-react";
import {
  useAdminAllFinesQuery,
  useAdminFinesSummaryQuery,
  useAdminPaymentHistoryQuery,
  useAdminConfirmManualPaymentMutation,
  useAdminWaiveFineMutation,
  useSimulateDokuWebhookMutation,
} from "@/services/fines.service";
import { generatePagination } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fine = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payment = Record<string, any>;

// ─── Helper ──────────────────────────────────────────────────────────────────
function formatRp(amount: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unpaid: "bg-red-100 text-red-600",
    paid: "bg-emerald-100 text-emerald-700",
    waived: "bg-blue-100 text-blue-700",
  };
  const labels: Record<string, string> = {
    unpaid: "Belum Bayar",
    paid: "Lunas",
    waived: "Dibebaskan",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PayMethodBadge({ method }: { method?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    doku: { label: "DOKU Online", cls: "bg-orange-100 text-orange-700" },
    cash: { label: "Tunai", cls: "bg-emerald-100 text-emerald-700" },
    transfer: { label: "Transfer", cls: "bg-blue-100 text-blue-700" },
    waived: { label: "Dibebaskan", cls: "bg-purple-100 text-purple-700" },
  };
  const info = map[method ?? ""] ?? { label: method ?? "-", cls: "bg-slate-100 text-slate-500" };
  return (
    <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold ${info.cls}`}>
      {info.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDendaPage() {
  const [activeTab, setActiveTab] = useState<"semua" | "riwayat">("semua");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // ── Confirm Manual Payment Modal ──
  const [manualModal, setManualModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "transfer" | "doku_webhook">("cash");
  const [payNotes, setPayNotes] = useState("");

  // ── Waive Fine Modal ──
  const [waiveModal, setWaiveModal] = useState(false);
  const [waiveReason, setWaiveReason] = useState("");

  // ── Webhook Simulation Modal ──
  const [webhookModal, setWebhookModal] = useState(false);
  const [webhookInvoice, setWebhookInvoice] = useState("");
  const [webhookAmount, setWebhookAmount] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<"SUCCESS" | "FAILED">("SUCCESS");

  // ── Status modal ──
  const [statusModal, setStatusModal] = useState<{
    open: boolean; type: "success" | "failed"; title: string; message: string;
  }>({ open: false, type: "success", title: "", message: "" });

  // ── API Hooks ──
  const finesParams = useMemo(() => ({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    per_page: PER_PAGE,
    page,
  }), [statusFilter, searchQuery, fromDate, toDate, page]);

  const { data: finesRes, isLoading: isLoadingFines, refetch: refetchFines } =
    useAdminAllFinesQuery(finesParams);
  const { data: summaryRes, isLoading: isLoadingSummary, refetch: refetchSummary } =
    useAdminFinesSummaryQuery();
  const { data: historyRes, isLoading: isLoadingHistory, refetch: refetchHistory } =
    useAdminPaymentHistoryQuery({ per_page: PER_PAGE });

  const [confirmManual, { isLoading: isConfirming }] = useAdminConfirmManualPaymentMutation();
  const [waiveFine, { isLoading: isWaiving }] = useAdminWaiveFineMutation();
  const [simulateWebhook, { isLoading: isSimulating }] = useSimulateDokuWebhookMutation();

  // ── Data parsing ──
  const rawFines: Fine[] = useMemo(() => {
    const d = finesRes?.data as Record<string, unknown>;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data as Fine[];
    if (Array.isArray(d.fines)) return d.fines as Fine[];
    return [];
  }, [finesRes]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pagination = (finesRes?.data as any)?.pagination || (finesRes?.data as any)?.meta || null;
  const totalPages = pagination?.last_page ?? (Math.ceil((rawFines.length || 1) / PER_PAGE) || 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary = summaryRes?.data as any;
  const rawHistory: Payment[] = useMemo(() => {
    const d = historyRes?.data as Record<string, unknown>;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data as Payment[];
    if (Array.isArray(d.payments)) return d.payments as Payment[];
    return [];
  }, [historyRes]);

  // ── Handlers ──
  function showStatus(type: "success" | "failed", title: string, message: string) {
    setStatusModal({ open: true, type, title, message });
  }

  function openManual(fine: Fine) {
    setSelectedFine(fine);
    setPayMethod("cash");
    setPayNotes("");
    setManualModal(true);
  }

  function openWaive(fine: Fine) {
    setSelectedFine(fine);
    setWaiveReason("");
    setWaiveModal(true);
  }

  async function handleManualConfirm() {
    if (!selectedFine) return;

    if (payMethod === "doku_webhook") {
      setManualModal(false);
      setWebhookInvoice("");
      setWebhookAmount(selectedFine.fine_amount?.toString() || "");
      setWebhookStatus("SUCCESS");
      setWebhookModal(true);
      return;
    }

    try {
      // API uses loan_id (fine.loan_id) as route param
      const loanId = selectedFine.loan_id ?? selectedFine.id;
      await confirmManual({
        id: loanId,
        payment_method: payMethod,
        notes: payNotes || `Dibayar ${payMethod === "cash" ? "tunai" : "transfer"} oleh admin.`,
      }).unwrap();
      setManualModal(false);
      refetchFines();
      refetchSummary();
      showStatus("success", "Pembayaran Dikonfirmasi", "Denda berhasil ditandai sebagai lunas.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setManualModal(false);
      showStatus("failed", "Gagal Mengkonfirmasi", err?.data?.message ?? "Terjadi kesalahan sistem.");
    }
  }

  async function handleWaiveConfirm() {
    if (!selectedFine || !waiveReason.trim()) return;
    try {
      const loanId = selectedFine.loan_id ?? selectedFine.id;
      await waiveFine({ id: loanId, reason: waiveReason }).unwrap();
      setWaiveModal(false);
      refetchFines();
      refetchSummary();
      showStatus("success", "Denda Dibebaskan", "Denda member berhasil dibebaskan.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setWaiveModal(false);
      showStatus("failed", "Gagal Membebaskan", err?.data?.message ?? "Terjadi kesalahan sistem.");
    }
  }

  async function handleWebhookSend() {
    if (!webhookInvoice.trim() || !webhookAmount.trim()) return;
    try {
      await simulateWebhook({
        invoice_number: webhookInvoice.trim(),
        amount: Number(webhookAmount),
        status: webhookStatus,
      }).unwrap();
      setWebhookModal(false);
      refetchFines();
      refetchSummary();
      refetchHistory();
      showStatus(
        "success",
        "Webhook Terkirim",
        `Simulasi DOKU Webhook (${webhookStatus}) berhasil dikirim ke server.`
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setWebhookModal(false);
      showStatus("failed", "Webhook Gagal", err?.data?.message ?? "Server menolak permintaan webhook.");
    }
  }

  function handleSearch(val: string) {
    setSearchQuery(val);
    setPage(1);
  }
  function handleStatusFilter(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader
        title="Manajemen Denda"
        subtitle="Kelola, konfirmasi, dan pantau seluruh transaksi denda anggota perpustakaan."
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">

        {/* ── SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoadingSummary ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 animate-pulse h-28" />
            ))
          ) : (
            <>
              {/* Total Unpaid */}
              <div className="rounded-2xl p-6 bg-red-50 border border-red-100 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">Belum Dibayar</p>
                <div>
                  <p className="text-2xl font-black text-red-600 leading-none">{formatRp(summary?.unpaid_total ?? 0)}</p>
                  <p className="text-[11px] text-red-400 mt-1">{summary?.unpaid_count ?? 0} transaksi</p>
                </div>
              </div>

              {/* Total Paid */}
              <div className="rounded-2xl p-6 bg-emerald-50 border border-emerald-100 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Total Terkumpul</p>
                <div>
                  <p className="text-2xl font-black text-emerald-700 leading-none">{formatRp(summary?.paid_total ?? 0)}</p>
                  <p className="text-[11px] text-emerald-400 mt-1">{summary?.paid_count ?? 0} lunas</p>
                </div>
              </div>

              {/* DOKU Revenue */}
              <div className="rounded-2xl p-6 bg-orange-50 border border-orange-100 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">Revenue DOKU</p>
                <div>
                  <p className="text-2xl font-black text-orange-700 leading-none">{formatRp(summary?.doku_revenue ?? summary?.revenue_doku ?? 0)}</p>
                  <p className="text-[11px] text-orange-400 mt-1">Online payment</p>
                </div>
              </div>

              {/* Waived */}
              <div className="rounded-2xl p-6 bg-blue-50 border border-blue-100 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Dibebaskan</p>
                <div>
                  <p className="text-2xl font-black text-blue-700 leading-none">{summary?.waived_count ?? 0}x</p>
                  <p className="text-[11px] text-blue-400 mt-1">{formatRp(summary?.waived_total ?? 0)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["semua", "riwayat"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === t
                    ? "bg-white text-[#99BD4A] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "semua" ? "Semua Denda" : "Riwayat Pembayaran"}
              </button>
            ))}
          </div>

          {/* Webhook button */}
          <button
            onClick={() => { setWebhookInvoice(""); setWebhookAmount(""); setWebhookStatus("SUCCESS"); setWebhookModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm"
          >
            <Webhook className="w-4 h-4" />
            Simulasi DOKU Webhook
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: SEMUA DENDA
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "semua" && (
          <div className="space-y-4">

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Cari nama anggota atau judul buku..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#99BD4A] transition-colors"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#99BD4A] appearance-none transition-colors cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  <option value="unpaid">Belum Bayar</option>
                  <option value="paid">Lunas</option>
                  <option value="waived">Dibebaskan</option>
                </select>
              </div>

              {/* From Date */}
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#99BD4A] transition-colors cursor-pointer"
                title="Dari Tanggal"
              />
              <span className="text-slate-400 text-sm font-bold">—</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#99BD4A] transition-colors cursor-pointer"
                title="Sampai Tanggal"
              />

              {/* Reset filter */}
              {(statusFilter || searchQuery || fromDate || toDate) && (
                <button
                  onClick={() => { setStatusFilter(""); setSearchQuery(""); setFromDate(""); setToDate(""); setPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </button>
              )}

              {/* Refresh */}
              <button
                onClick={() => refetchFines()}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Anggota</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Buku</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Keterlambatan</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Total Denda</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Dibuat</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingFines ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          {Array.from({ length: 7 }).map((__, j) => (
                            <td key={j} className="py-5 px-6">
                              <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : rawFines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                            <p className="text-sm font-bold text-slate-400">Tidak ada data denda</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rawFines.map((fine) => (
                        <tr
                          key={fine.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Anggota */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <span className="text-xs font-black text-blue-600">
                                  {(fine.member_name ?? fine.member?.name ?? "?").substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 leading-none">
                                  {fine.member_name ?? fine.member?.name ?? "-"}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {fine.member_code ?? fine.member?.member_code ?? "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Buku */}
                          <td className="py-5 px-6">
                            <p className="text-sm font-medium text-slate-700 max-w-[160px] leading-tight line-clamp-2">
                              {fine.book_title ?? fine.loan?.book?.title ?? "-"}
                            </p>
                          </td>

                          {/* Keterlambatan */}
                          <td className="py-5 px-6">
                            <span className="text-sm font-bold text-red-500">
                              {fine.days_late ?? 0} hari
                            </span>
                          </td>

                          {/* Total Denda */}
                          <td className="py-5 px-6">
                            <span className="text-sm font-black text-slate-800">
                              {formatRp(fine.fine_amount ?? 0)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-5 px-6">
                            <StatusBadge status={fine.status ?? "unpaid"} />
                          </td>

                          {/* Dibuat */}
                          <td className="py-5 px-6 text-sm text-slate-400 font-medium whitespace-nowrap">
                            {formatDate(fine.created_at)}
                          </td>

                          {/* Aksi */}
                          <td className="py-5 px-6">
                            {fine.status === "unpaid" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openManual(fine)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#99BD4A] hover:bg-[#88ab3d] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                  Bayar Manual
                                </button>
                                <button
                                  onClick={() => openWaive(fine)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                                >
                                  <ShieldOff className="w-3.5 h-3.5" />
                                  Bebaskan
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Selesai</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!isLoadingFines && rawFines.length > 0 && (
                <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400">
                    Halaman {page} dari {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {generatePagination(page, totalPages).map((p, idx) =>
                      p === "..." ? (
                        <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-9 h-9 rounded-xl font-black text-sm transition-colors ${
                            page === p ? "bg-[#99BD4A] text-white" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: RIWAYAT PEMBAYARAN
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "riwayat" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                Histori Transaksi Pembayaran
              </h3>
              <button
                onClick={() => refetchHistory()}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Method Legend */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "DOKU Online", cls: "bg-orange-100 text-orange-700" },
                { label: "Tunai", cls: "bg-emerald-100 text-emerald-700" },
                { label: "Transfer", cls: "bg-blue-100 text-blue-700" },
                { label: "Dibebaskan", cls: "bg-purple-100 text-purple-700" },
              ].map((m) => (
                <span key={m.label} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${m.cls}`}>
                  {m.label}
                </span>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anggota</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metode</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jumlah</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingHistory ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          {Array.from({ length: 6 }).map((__, j) => (
                            <td key={j} className="py-5 px-6">
                              <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : rawHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <History className="w-8 h-8 text-slate-300" />
                            <p className="text-sm font-bold text-slate-400">Belum ada riwayat pembayaran</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rawHistory.map((pay, idx) => (
                        <tr key={pay.id ?? idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          {/* Invoice */}
                          <td className="py-5 px-6">
                            <code className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {pay.invoice_number ?? pay.order_code ?? `-`}
                            </code>
                          </td>

                          {/* Anggota */}
                          <td className="py-5 px-6">
                            <p className="text-sm font-bold text-slate-800 leading-none">
                              {pay.member_name ?? pay.member?.name ?? pay.fine?.member_name ?? "-"}
                            </p>
                          </td>

                          {/* Metode */}
                          <td className="py-5 px-6">
                            <PayMethodBadge method={pay.payment_method ?? pay.method} />
                          </td>

                          {/* Jumlah */}
                          <td className="py-5 px-6">
                            <span className="text-sm font-black text-slate-800">
                              {formatRp(pay.amount ?? pay.total_amount ?? 0)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-5 px-6">
                            {pay.status === "success" || pay.status === "paid" ? (
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Berhasil</span>
                              </span>
                            ) : pay.status === "pending" ? (
                              <span className="flex items-center gap-1.5 text-yellow-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Menunggu</span>
                              </span>
                            ) : pay.status === "failed" || pay.status === "expired" ? (
                              <span className="flex items-center gap-1.5 text-red-500">
                                <X className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Gagal</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">{pay.status ?? "-"}</span>
                            )}
                          </td>

                          {/* Tanggal */}
                          <td className="py-5 px-6 text-sm text-slate-400 font-medium whitespace-nowrap">
                            {formatDate(pay.paid_at ?? pay.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: KONFIRMASI PEMBAYARAN MANUAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={manualModal} onOpenChange={(o) => !o && setManualModal(false)}>
        <DialogContent className="sm:max-w-[440px] p-0 border-0 rounded-[24px] [&>button]:hidden shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-b from-emerald-50 via-white to-white p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-slate-800 leading-none">
                    Konfirmasi Pembayaran
                  </DialogTitle>
                  <p className="text-[11px] text-slate-400 mt-0.5">Manual oleh Admin</p>
                </div>
              </div>
              <button onClick={() => setManualModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fine Info */}
            {selectedFine && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Detail Denda</p>
                <p className="text-sm font-bold text-slate-800 mb-0.5">
                  {selectedFine.member_name ?? selectedFine.member?.name ?? "-"}
                </p>
                <p className="text-[12px] text-slate-500 mb-2">
                  {selectedFine.book_title ?? selectedFine.loan?.book?.title ?? "-"}
                </p>
                <p className="text-xl font-black text-red-600">{formatRp(selectedFine.fine_amount)}</p>
              </div>
            )}

            {/* Method Select */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Metode Pembayaran</p>
              <div className="grid grid-cols-1 gap-3">
                {(["cash", "transfer", "doku_webhook"] as const).map((m) => (
                  <div
                    key={m}
                    onClick={() => setPayMethod(m)}
                    className={`border-2 rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all ${
                      payMethod === m
                        ? "border-[#99BD4A] bg-[#f6fbee]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {m === "cash" && <Banknote className="w-5 h-5 text-emerald-600" />}
                    {m === "transfer" && <Landmark className="w-5 h-5 text-blue-600" />}
                    {m === "doku_webhook" && <QrCode className="w-5 h-5 text-red-600" />}
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {m === "cash" ? "Tunai" : m === "transfer" ? "Transfer" : "E-Wallet / DOKU QRIS"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {m === "cash" ? "Cash di tempat" : m === "transfer" ? "Bank transfer" : "GoPay, OVO, ShopeePay (Simulasi Webhook)"}
                      </p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 transition-all ${
                      payMethod === m ? "border-[#99BD4A] bg-[#99BD4A]" : "border-slate-300"
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="cth: Dibayar tunai pada 9 Juni 2026..."
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#99BD4A] resize-none placeholder:text-slate-300 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setManualModal(false)} className="flex-1 h-11 rounded-xl font-bold border-slate-200">
                Batal
              </Button>
              <Button
                onClick={handleManualConfirm}
                disabled={isConfirming}
                className="flex-1 h-11 rounded-xl font-bold bg-[#99BD4A] hover:bg-[#88ab3d] text-white disabled:opacity-50"
              >
                {isConfirming ? "Memproses..." : "Konfirmasi Bayar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: BEBASKAN DENDA (WAIVE)
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={waiveModal} onOpenChange={(o) => !o && setWaiveModal(false)}>
        <DialogContent className="sm:max-w-[400px] p-0 border-0 rounded-[24px] [&>button]:hidden shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-b from-blue-50 via-white to-white p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShieldOff className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-slate-800 leading-none">Bebaskan Denda</DialogTitle>
                  <p className="text-[11px] text-slate-400 mt-0.5">Waive Fine — Admin Only</p>
                </div>
              </div>
              <button onClick={() => setWaiveModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium text-yellow-800 leading-relaxed">
                Anggota tidak perlu membayar denda. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {/* Fine Info */}
            {selectedFine && (
              <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                <p className="text-sm font-bold text-slate-800">{selectedFine.member_name ?? selectedFine.member?.name ?? "-"}</p>
                <p className="text-[12px] text-slate-500 mb-2">{selectedFine.book_title ?? "-"}</p>
                <p className="text-xl font-black text-red-600">{formatRp(selectedFine.fine_amount)}</p>
              </div>
            )}

            {/* Reason */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Alasan Pembebasan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="cth: Member aktif dengan kontribusi besar..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 resize-none placeholder:text-slate-300 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setWaiveModal(false)} className="flex-1 h-11 rounded-xl font-bold border-slate-200">
                Batal
              </Button>
              <Button
                onClick={handleWaiveConfirm}
                disabled={isWaiving || !waiveReason.trim()}
                className="flex-1 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isWaiving ? "Memproses..." : "Ya, Bebaskan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: SIMULASI DOKU WEBHOOK
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={webhookModal} onOpenChange={(o) => !o && setWebhookModal(false)}>
        <DialogContent className="sm:max-w-[700px] p-0 border-0 rounded-[32px] [&>button]:hidden shadow-2xl bg-white max-h-[95vh] flex flex-col">
          <div className="bg-gradient-to-b from-orange-50 via-white to-white p-6 sm:p-8 flex-1 overflow-y-auto smooth-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Webhook className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-slate-800 leading-none">Simulasi DOKU Webhook</DialogTitle>
                  <p className="text-[11px] text-slate-400 mt-0.5">POST /webhooks/doku</p>
                </div>
              </div>
              <button onClick={() => setWebhookModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5 flex gap-3">
              <Eye className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-orange-800 mb-0.5">Mode Simulasi</p>
                <p className="text-[11px] font-medium text-orange-700 leading-relaxed">
                  Simulasi callback DOKU untuk menguji alur pembayaran online. Header HMAC akan dikirim secara mock.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* KOLOM KIRI: FORM */}
              <div>
                {/* Invoice Number */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={webhookInvoice}
                    onChange={(e) => setWebhookInvoice(e.target.value)}
                    placeholder="cth: ILMS-FINE-1-20260609200000"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-orange-400 focus:outline-none placeholder:text-slate-300 transition-colors"
                  />
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Jumlah (IDR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={webhookAmount}
                      onChange={(e) => setWebhookAmount(e.target.value)}
                      placeholder="5000"
                      min={0}
                      className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-800 focus:border-orange-400 focus:outline-none placeholder:text-slate-300 transition-colors"
                    />
                  </div>
                </div>

                {/* Transaction Status */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Status Transaksi</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["SUCCESS", "FAILED"] as const).map((s) => (
                      <div
                        key={s}
                        onClick={() => setWebhookStatus(s)}
                        className={`border-2 rounded-xl p-3 cursor-pointer flex items-center gap-2 transition-all ${
                          webhookStatus === s
                            ? s === "SUCCESS"
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-red-400 bg-red-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {s === "SUCCESS"
                          ? <CheckCircle2 className={`w-4 h-4 shrink-0 ${webhookStatus === s ? "text-emerald-600" : "text-slate-400"}`} />
                          : <X className={`w-4 h-4 shrink-0 ${webhookStatus === s ? "text-red-500" : "text-slate-400"}`} />
                        }
                        <div>
                          <p className={`text-[11px] font-black leading-tight ${
                            webhookStatus === s ? (s === "SUCCESS" ? "text-emerald-700" : "text-red-600") : "text-slate-600"
                          }`}>{s}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN: PREVIEW */}
              <div className="bg-[#0F172A] rounded-xl p-5 border border-slate-800 shadow-inner h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Webhook className="w-3 h-3" /> Payload Preview
                  </p>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  </div>
                </div>
                <div className="overflow-x-auto smooth-scrollbar pb-2 flex-1">
                  <pre className="text-[11px] text-[#A7F3D0] font-mono leading-relaxed whitespace-pre">
{`{
  "order": {
    "invoice_number": 
      "${webhookInvoice || "ILMS-FINE-..."}",
    "amount": ${webhookAmount || 0}
  },
  "transaction": {
    "status": "${webhookStatus}"
  },
  "channel": { "id": "QRIS" }
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setWebhookModal(false)} className="flex-1 h-11 rounded-xl font-bold border-slate-200">
                Batal
              </Button>
              <Button
                onClick={handleWebhookSend}
                disabled={isSimulating || !webhookInvoice.trim() || !webhookAmount.trim()}
                className="flex-1 h-11 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
              >
                {isSimulating ? "Mengirim..." : "Kirim Webhook"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          STATUS MODAL (global)
      ══════════════════════════════════════════════════════════════════════ */}
      <StatusModal
        isOpen={statusModal.open}
        onOpenChange={(o) => !o && setStatusModal((s) => ({ ...s, open: false }))}
        status={statusModal.type}
        title={statusModal.title}
        description={statusModal.message}
        actionLabel="Tutup"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM: Stats Panel — Revenue Breakdown
      ══════════════════════════════════════════════════════════════════════ */}
      {!isLoadingSummary && summary && (
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          <div className="bg-slate-900 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Revenue Bulan Ini
              </p>
              <p className="text-3xl font-black text-white leading-none">
                {formatRp(summary.revenue_this_month ?? summary.monthly_revenue ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">dari denda terkumpul</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4" /> Revenue Online (DOKU)
              </p>
              <p className="text-3xl font-black text-orange-400 leading-none">
                {formatRp(summary.doku_revenue ?? summary.revenue_doku ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">QRIS, GoPay, OVO, dll</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Revenue Manual
              </p>
              <p className="text-3xl font-black text-emerald-400 leading-none">
                {formatRp(summary.manual_revenue ?? summary.revenue_manual ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Tunai & Transfer bank</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
