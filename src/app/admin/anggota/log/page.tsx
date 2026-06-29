"use client";

import { useState, useMemo, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Filter,
  Download,
  Monitor,
  User,
  RefreshCw,
  Activity,
  Loader2,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useAllLogsQuery } from "@/services/logs.service";
import * as XLSX from "xlsx";

interface LogItem {
  id: string;
  type: string;
  actor: string;
  actorType: "admin" | "system";
  target: string;
  description: string;
  highlightText?: string;
  status: "success" | "error" | "info" | "warning";
  statusLabel: string;
  ip: string | null;
  autoLogId?: string;
  relativeTime: string;
  date: string;
  dateLabel: string;
}

const statusCfg = {
  success: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    leftBar: "bg-emerald-400",
    avatarRing: "ring-emerald-200",
  },
  error: {
    badge: "bg-red-50 text-red-600 border border-red-200",
    leftBar: "bg-red-400",
    avatarRing: "ring-red-200",
  },
  info: {
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    leftBar: "bg-blue-400",
    avatarRing: "ring-blue-200",
  },
  warning: {
    badge: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    leftBar: "bg-yellow-400",
    avatarRing: "ring-yellow-200",
  },
};

function renderDescription(log: LogItem) {
  if (!log.highlightText) {
    return <span>{log.description}</span>;
  }
  const parts = log.description.split(log.highlightText);
  return (
    <span>
      {parts[0]}
      <span className="text-red-500 italic font-semibold">{log.highlightText}</span>
      {parts[1]}
    </span>
  );
}

function ActorAvatar({ actorType, ring }: { actorType: "admin" | "system"; ring: string }) {
  const base = `w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-2 ${ring}`;
  if (actorType === "system") {
    return (
      <div className={`${base} bg-slate-100`}>
        <Monitor className="w-4.5 h-4.5 text-slate-500" />
      </div>
    );
  }
  return (
    <div className="relative shrink-0">
      <div className={`${base} bg-slate-200`}>
        <User className="w-4.5 h-4.5 text-slate-500" />
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
      </div>
    </div>
  );
}

export default function LogAktivitasPage() {
  const [typeFilter, setTypeFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [visibleCount, setVisibleCount] = useState(5);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const [logData, setLogData] = useState<LogItem[]>([]);

  const { data: logsApiRes, isLoading } = useAllLogsQuery({});

  // ── Export to Excel ──────────────────────────────────────────────
  const handleExportExcel = async () => {
    setIsExporting("excel");
    try {
      const rows = logData.map((log) => ({
        "Tanggal": log.date,
        "Tipe": log.type,
        "Pelaku": log.actor,
        "Status": log.statusLabel,
        "Detail / Pesan": log.description,
        "Ref ID": log.autoLogId ?? "-",
        "IP Address": log.ip ?? "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Log Aktivitas");

      // Fit column widths
      const colWidths = [
        { wch: 22 }, // Tanggal
        { wch: 18 }, // Tipe
        { wch: 14 }, // Pelaku
        { wch: 18 }, // Status
        { wch: 50 }, // Detail
        { wch: 12 }, // Ref ID
        { wch: 16 }, // IP
      ];
      worksheet["!cols"] = colWidths;

      const now = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Log_Aktivitas_ILMS_${now}.xlsx`);
    } finally {
      setIsExporting(null);
    }
  };

  // ── Export to PDF ─────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setIsExporting("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Header
      doc.setFillColor(153, 189, 74); // #99BD4A
      doc.rect(0, 0, 297, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Log Aktivitas Sistem — ILMS", 14, 14);

      const now = new Date();
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Dicetak: ${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} ${now.toLocaleTimeString("id-ID")}`,
        297 - 14,
        14,
        { align: "right" }
      );

      // Table
      autoTable(doc, {
        startY: 28,
        head: [["No", "Tanggal", "Tipe", "Pelaku", "Status", "Detail / Pesan", "Ref ID"]],
        body: logData.map((log, i) => [
          i + 1,
          new Date(log.date).toLocaleString("id-ID"),
          log.type,
          log.actor,
          log.statusLabel,
          log.description,
          log.autoLogId ?? "-",
        ]),
        headStyles: {
          fillColor: [153, 189, 74],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [247, 250, 244] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 34 },
          2: { cellWidth: 24 },
          3: { cellWidth: 18 },
          4: { cellWidth: 22 },
          5: { cellWidth: "auto" },
          6: { cellWidth: 16 },
        },
        margin: { left: 14, right: 14 },
      });

      // Page numbers
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Halaman ${p} / ${pageCount}`, 297 / 2, doc.internal.pageSize.height - 6, { align: "center" });
      }

      const nowStr = now.toISOString().slice(0, 10);
      doc.save(`Log_Aktivitas_ILMS_${nowStr}.pdf`);
    } finally {
      setIsExporting(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (logsApiRes && (logsApiRes?.data as any)?.logs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiLogs = (logsApiRes.data as any).logs;
      const mapped = apiLogs.map((log: {
        id: number;
        log_type: string;
        log_location: string;
        sub_module: string;
        log_msg: string;
        action: string;
        ref_id: number | null;
        log_date: string;
        time_ago: string;
      }) => {
        const isError = log.log_type === "error";
        const isWarning = log.action === "DITOLAK";
        const status = isError ? "error" : isWarning ? "warning" : "success";

        const dateObj = new Date(log.log_date);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        return {
          id: log.id.toString(),
          type: log.log_type,
          actor: log.log_location === "system" ? "System" : "Admin",
          actorType: log.log_location === "system" ? "system" : "admin",
          target: log.sub_module,
          description: log.log_msg,
          highlightText: "",
          status: status,
          statusLabel: log.action || "Log",
          ip: null,
          autoLogId: log.ref_id ? log.ref_id.toString() : undefined,
          relativeTime: log.time_ago || dateObj.toLocaleTimeString("id-ID"),
          date: log.log_date,
          dateLabel: dateStr
        };
      });
      setLogData(mapped);
    }
  }, [logsApiRes]);

  const filtered = useMemo(() => {
    return logData.filter((log) => {
      const matchType = typeFilter === "semua" || log.type === typeFilter;
      const matchStatus = statusFilter === "semua" || log.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [logData, typeFilter, statusFilter]);

  const visibleLogs = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const grouped = useMemo(() => {
    const map = new Map<string, LogItem[]>();
    visibleLogs.forEach((log) => {
      if (!map.has(log.dateLabel)) map.set(log.dateLabel, []);
      map.get(log.dateLabel)!.push(log);
    });
    return Array.from(map.entries());
  }, [visibleLogs]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Log Aktivitas"
        subtitle="Daftar history log aktivitas admin ILMS"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Log Aktivitas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Audit komprehensif tindakan administratif dalam ekosistem ILMS.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select
              value={typeFilter}
              onValueChange={(v) => { setTypeFilter(v); setVisibleCount(5); }}
            >
              <SelectTrigger className="h-9 w-auto text-sm bg-white border-slate-200 gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Jenis</SelectItem>
                <SelectItem value="verifikasi">Verifikasi</SelectItem>
                <SelectItem value="penolakan">Penolakan</SelectItem>
                <SelectItem value="peminjaman">Peminjaman</SelectItem>
                <SelectItem value="keterlambatan">Keterlambatan</SelectItem>
                <SelectItem value="info">Info Sistem</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setVisibleCount(5); }}
            >
              <SelectTrigger className="h-9 w-auto text-sm bg-white border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="success">Sukses</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Peringatan</SelectItem>
                <SelectItem value="error">Ditolak / Error</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={!!isExporting || isLoading}
                  className="h-9 gap-2 bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold text-sm disabled:opacity-60"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExporting === "excel"
                    ? "Mengekspor Excel…"
                    : isExporting === "pdf"
                    ? "Mengekspor PDF…"
                    : "Export Report"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleExportExcel}
                  className="cursor-pointer gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export ke Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>Export ke PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Timeline Card */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#99BD4A]" />
                <p className="text-sm font-medium">Memuat log aktivitas...</p>
              </div>
            ) : grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Activity className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Tidak ada log yang sesuai filter</p>
              </div>
            ) : (
              grouped.map(([dateLabel, logs]) => (
                <div key={dateLabel} className="mb-8 last:mb-0">
                  {/* Date Group Label */}
                  <p className="text-[11px] font-bold text-[#99BD4A] tracking-widest uppercase mb-4 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#99BD4A]" />
                    {dateLabel}
                  </p>

                  {/* Entries */}
                  <div className="flex flex-col gap-3">
                    {logs.map((log) => {
                      const cfg = statusCfg[log.status] ?? statusCfg.info;
                      return (
                        <div
                          key={log.id}
                          className="relative flex items-start gap-4 bg-slate-50/70 rounded-xl border border-slate-100 px-5 py-4 hover:bg-white hover:shadow-sm transition-all overflow-hidden"
                        >
                          {/* Left accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${cfg.leftBar}`} />

                          {/* Avatar */}
                          <ActorAvatar actorType={log.actorType} ring={cfg.avatarRing} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-slate-900 text-[14px]">
                                {log.actor}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                {log.statusLabel}
                              </span>
                            </div>
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                              {renderDescription(log)}
                            </p>
                          </div>

                          {/* Meta Info */}
                          <div className="text-right shrink-0 space-y-0.5">
                            <p className="text-[12px] font-semibold text-slate-500">{log.relativeTime}</p>
                            {log.ip && (
                              <p className="text-[11px] text-slate-400">IP: {log.ip}</p>
                            )}
                            {log.autoLogId && (
                              <p className="text-[11px] text-slate-400">{log.autoLogId}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  className="gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Muat Aktivitas Lebih Lama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
