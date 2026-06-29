"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { generatePagination } from "@/lib/utils";
import { usePendingMembersQuery } from "@/services/members.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SemuaPeninjauanPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: membersApiRes } = usePendingMembersQuery();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [peninjauanState, setPeninjauanState] = useState<any[]>([]);

  useEffect(() => {
    if (membersApiRes?.data) {
      let membersArray = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = membersApiRes.data as any;
      if (Array.isArray(data)) {
        membersArray = data;
      } else if (data.members && Array.isArray(data.members)) {
        membersArray = data.members;
      } else if (data.data && Array.isArray(data.data)) {
        membersArray = data.data;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = membersArray.map((m: any) => {
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
      setPeninjauanState(mapped);
    }
  }, [membersApiRes]);

  // Filter Data
  const filteredData = peninjauanState.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nik.includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchStatus = 
      statusFilter === "semua" || 
      item.status === statusFilter.toUpperCase() ||
      (statusFilter === "menunggu" && item.status === "MENUNGGU VERIFIKASI");
      
    return matchSearch && matchStatus;
  });

  // Paginate Data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Manajemen Anggota"
        subtitle="Semua Entri Peninjauan"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Semua Entri Peninjauan
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Daftar lengkap seluruh pengajuan pendaftaran anggota perpustakaan yang perlu atau telah ditinjau.
          </p>
        </div>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama, email, atau NIK/NISN..."
                  className="pl-9 bg-slate-50/50"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset page on search
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1); // Reset page on filter
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-slate-50/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Status: Semua</SelectItem>
                    <SelectItem value="terverifikasi">Terverifikasi</SelectItem>
                    <SelectItem value="menunggu">Menunggu</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="terbaru">
                  <SelectTrigger className="w-[180px] bg-slate-50/50">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbaru">Urutkan: Terbaru</SelectItem>
                    <SelectItem value="terlama">Urutkan: Terlama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-slate-100 overflow-hidden">
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
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                        Tidak ada data yang ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Info */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm font-medium text-slate-500 tracking-wider uppercase text-[10px]">
                MENAMPILKAN {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, filteredData.length)} DARI {filteredData.length} ENTRI
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  disabled={currentPage === 1 || filteredData.length === 0}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {generatePagination(currentPage, totalPages).map((page, i) => (
                  <Button
                    key={i}
                    variant={page === '...' ? "ghost" : currentPage === page ? "default" : "outline"}
                    size="sm"
                    disabled={page === '...'}
                    className={`w-8 h-8 ${
                      page === '...'
                        ? "cursor-default border-none hover:bg-transparent"
                        : currentPage === page
                        ? "bg-[#99BD4A] hover:bg-[#99BD4A]/80 text-white border-none"
                        : ""
                    }`}
                    onClick={() => {
                      if (page !== '...') setCurrentPage(page as number);
                    }}
                  >
                    {page}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8"
                  disabled={currentPage >= totalPages || filteredData.length === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
