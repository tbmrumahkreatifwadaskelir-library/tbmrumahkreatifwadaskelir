"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logData from "@/json/log-aktivitas.json";

const ITEMS_PER_PAGE = 6;

type LogStatus = "success" | "error" | "info" | "warning";

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

const statusConfig: Record<LogStatus, { icon: React.ReactNode; bg: string; border: string; badge: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
    bg: "bg-red-50",
    border: "border-red-100",
    badge: "bg-red-100 text-red-700",
  },
  info: {
    icon: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
    bg: "bg-blue-50",
    border: "border-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />,
    bg: "bg-yellow-50",
    border: "border-yellow-100",
    badge: "bg-yellow-100 text-yellow-700",
  },
};

const typeLabel: Record<string, string> = {
  pendaftaran: "Pendaftaran",
  verifikasi: "Verifikasi",
  peminjaman: "Peminjaman",
  pengembalian: "Pengembalian",
  penolakan: "Penolakan",
  keterlambatan: "Keterlambatan",
  nonaktif: "Nonaktif",
};

function formatTimestamp(relativeTime: string) {
  return relativeTime;
}

interface LogAktivitasSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogAktivitasSheet({ open, onOpenChange }: LogAktivitasSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = (logData as unknown as LogItem[]).filter((log) => {
    const matchSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === "semua" || log.type === typeFilter;
    const matchStatus = statusFilter === "semua" || log.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[500px] md:w-[600px] p-0 flex flex-col bg-white"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#99BD4A]/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-[#99BD4A]" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-slate-900">
                Log Aktivitas
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                Riwayat semua aktivitas anggota dan sistem
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari aktor, target, atau deskripsi..."
              className="pl-9 bg-slate-50 border-slate-200 text-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filter Row */}
          <div className="flex gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
              <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Jenis Aktivitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Jenis</SelectItem>
                <SelectItem value="pendaftaran">Pendaftaran</SelectItem>
                <SelectItem value="verifikasi">Verifikasi</SelectItem>
                <SelectItem value="peminjaman">Peminjaman</SelectItem>
                <SelectItem value="pengembalian">Pengembalian</SelectItem>
                <SelectItem value="penolakan">Penolakan</SelectItem>
                <SelectItem value="keterlambatan">Keterlambatan</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="h-8 text-xs w-[130px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="success">Berhasil</SelectItem>
                <SelectItem value="info">Informasi</SelectItem>
                <SelectItem value="warning">Peringatan</SelectItem>
                <SelectItem value="error">Gagal</SelectItem>
              </SelectContent>
            </Select>

            <span className="ml-auto text-xs text-slate-400 self-center">
              {filtered.length} entri
            </span>
          </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {currentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <ClipboardList className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Tidak ada log yang cocok</p>
            </div>
          ) : (
            currentLogs.map((log) => {
              const cfg = statusConfig[log.status as LogStatus] ?? statusConfig.info;
              return (
                <div
                  key={log.id}
                  className={`flex gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}
                >
                  {cfg.icon}
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}
                      >
                        {typeLabel[log.type] ?? log.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatTimestamp(log.relativeTime)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-snug">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-bold text-slate-700">{log.actor}</span>
                      <span className="text-slate-300">→</span>
                      <span>{log.target}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {filtered.length === 0
              ? "Tidak ada data"
              : `${startIdx + 1}–${Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} dari ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                size="sm"
                variant={currentPage === page ? "default" : "outline"}
                className={`w-7 h-7 text-xs ${
                  currentPage === page ? "bg-[#99BD4A] hover:bg-[#99BD4A]/80 text-white border-transparent" : ""
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
