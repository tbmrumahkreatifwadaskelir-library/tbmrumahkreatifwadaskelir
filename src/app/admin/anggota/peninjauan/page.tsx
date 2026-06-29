"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  XCircle,
  Users,
  BadgeCheck,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { usePendingMembersQuery, useMembersSummaryQuery, type MembersSummaryData } from "@/services/members.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PeninjauanAnggotaPage() {
  const { data: membersApiRes } = usePendingMembersQuery();
  const { data: summaryRes } = useMembersSummaryQuery();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pendingData: any[] = [];
  
  if (membersApiRes?.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = membersApiRes.data as any;
    let membersArray = [];
    if (Array.isArray(data)) {
      membersArray = data;
    } else if (data.members && Array.isArray(data.members)) {
      membersArray = data.members;
    } else if (data.data && Array.isArray(data.data)) {
      membersArray = data.data;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendingData = membersArray.map((m: any) => {
      const user = m.user || {};
      const statusStr = m.verification_status === 'verified' 
          ? 'TERVERIFIKASI' 
          : m.verification_status === 'rejected' 
          ? 'DITOLAK' 
          : 'MENUNGGU VERIFIKASI';
          
      return {
        id: m.id?.toString() || "-",
        name: user.name || m.name || "Tanpa Nama",
        email: user.email || m.email || "Tidak ada email",
        nik: m.nik_nisn || "-",
        date: m.created_at ? new Date(m.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-",
        status: statusStr,
        statusColor: statusStr === "TERVERIFIKASI" 
          ? "bg-green-100 text-green-700" 
          : statusStr === "DITOLAK" 
          ? "bg-slate-100 text-slate-700" 
          : "bg-red-100 text-red-700",
        initials: (user.name || m.name || "A").substring(0, 2).toUpperCase()
      };
    });
  }

  const summary: Partial<MembersSummaryData> = summaryRes?.data ?? {};

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Manajemen Anggota"
        subtitle="Peninjauan calon anggota baru"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Peninjauan Anggota Baru
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Kelola data lengkap keanggotaan dan pantau aktivitas pendaftaran
            anggota secara real-time.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="shadow-sm border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-28 h-20 bg-[#99BD4A]/10 rounded-bl-[40px] z-0"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-1.5 border-2 border-[#99BD4A] rounded-full text-[#99BD4A]">
                  <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="bg-[#99BD4A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider">
                  {summary.pending_count ?? pendingData.length} BARU
                </div>
              </div>
              <h3 className="text-4xl font-bold text-slate-900 mt-6 mb-2 tracking-tight">
                {summary.pending_count ?? pendingData.length}
              </h3>
              <p className="text-[11px] text-slate-600 font-bold tracking-wider uppercase">
                Pengajuan Menunggu
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="text-[#99BD4A] mb-4">
                <BadgeCheck className="w-9 h-9" strokeWidth={1.5} />
              </div>
              <h3 className="text-4xl font-bold text-slate-900 mt-6 mb-2 tracking-tight">
                {summary.approved_today || 0}
              </h3>
              <p className="text-[11px] text-slate-600 font-bold tracking-wider uppercase">
                Disetujui Hari Ini
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="text-[#991b1b] mb-4">
                <XCircle className="w-9 h-9" strokeWidth={1.5} />
              </div>
              <h3 className="text-4xl font-bold text-slate-900 mt-6 mb-2 tracking-tight">
                {summary.rejected_today || 0}
              </h3>
              <p className="text-[11px] text-slate-600 font-bold tracking-wider uppercase">
                Ditolak Hari Ini
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-transparent bg-[#99BD4A] text-white">
            <CardContent className="p-6">
              <div className="text-white mb-4">
                <Users className="w-9 h-9" strokeWidth={1.5} />
              </div>
              <h3 className="text-4xl font-bold text-white mt-6 mb-2 tracking-tight">
                {summary.total_members || 0}
              </h3>
              <p className="text-[11px] text-white/90 font-bold tracking-wider uppercase">
                Total Anggota Terdaftar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table Section */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                Pengajuan Terbaru
              </h2>
              <p className="text-sm text-muted-foreground">
                Meninjau entri pendaftaran terbaru
              </p>
            </div>
            <Link
              href="/admin/anggota/peninjauan/semua"
              className="text-xs font-bold text-[#99BD4A] tracking-wider hover:underline uppercase"
            >
              Lihat Semua Entri
            </Link>
          </div>

          <Card className="shadow-sm border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 text-xs tracking-wider py-4">
                    NAMA ANGGOTA
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs tracking-wider">
                    NIK/NISN
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs tracking-wider">
                    TANGGAL
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs tracking-wider">
                    STATUS DOKUMEN
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs tracking-wider text-right pr-6">
                    AKSI
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingData.length > 0 ? pendingData.slice(0, 5).map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {row.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {row.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">
                      {row.nik}
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">
                      {row.date}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${row.statusColor}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${row.status === "TERVERIFIKASI" ? "bg-green-500" : row.status === "DITOLAK" ? "bg-slate-500" : "bg-red-500"}`}
                        ></span>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {row.status === "TERVERIFIKASI" ? (
                        <Button
                          disabled
                          className="bg-slate-200 text-slate-400 font-bold tracking-wider text-[10px] uppercase px-6 h-8 rounded-md opacity-70 cursor-not-allowed"
                        >
                          Tinjau
                        </Button>
                      ) : row.status === "DITOLAK" ? (
                        <Button
                          asChild
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold tracking-wider text-[10px] uppercase px-6 h-8 rounded-md"
                        >
                          <Link href={`/admin/anggota/peninjauan/${row.id}`}>
                            Tinjau Ulang
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          className="bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold tracking-wider text-[10px] uppercase px-6 h-8 rounded-md"
                        >
                          <Link href={`/admin/anggota/peninjauan/${row.id}`}>
                            Tinjau
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      Tidak ada pengajuan terbaru.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Footer / Panduan Section */}
        <div className="bg-[#eaf1d6] rounded-2xl p-6 flex items-center gap-5 w-full">
          <div className="bg-white w-12 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <HelpCircle className="w-6 h-6 text-[#99BD4A]" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm mb-1.5">
              Panduan Tinjauan
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed pr-4">
              Pastikan semua unggahan dokumen memiliki resolusi tinggi dan
              sesuai dengan registri NIK/NISN sebelum persetujuan akhir.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
