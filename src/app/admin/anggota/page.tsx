"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, FileText, Info, Edit, Trash2, ChevronLeft, ChevronRight, RefreshCcw, Plus, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { generatePagination } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { StatusModal } from "@/components/ui/status-modal";
import { useEffect, useState } from "react";
import { useListMembersQuery, useDeleteMemberMutation, useUpdateMemberMutation } from "@/services/members.service";

interface Anggota {
  id: string;        // member_code (display)
  numericId: number; // member.id (API use)
  name: string;
  email: string;
  phone?: string;
  role?: string;
  joinDate?: string;
  status: string;
  loans?: number;
  initials?: string;
  color?: string;
  avatar?: string;
  address?: string;
  nik_nisn?: string;
  id_type?: "ktp" | "kk" | "kartu_pelajar";
  birth_date?: string;
  guardian_name?: string;
  guardian_nik?: string;
  guardian_phone?: string;
}

export default function ManajemenAnggotaPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [sortOrder, setSortOrder] = useState("terbaru");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const queryParams: Record<string, string | number> = {
    page: currentPage,
    per_page: itemsPerPage,
  };
  if (debouncedSearch) queryParams.search = debouncedSearch;
  if (statusFilter !== "semua") {
    queryParams.status = statusFilter === "aktif" ? "active" : "inactive"; // Or whatever backend expects, often active/suspended/pending
  }

  const { data: membersApiRes, isLoading } = useListMembersQuery(queryParams);
  const [deleteMemberApi, { isLoading: isDeleting }] = useDeleteMemberMutation();
  const [updateMemberApi] = useUpdateMemberMutation();
  const [membersState, setMembersState] = useState<Anggota[]>([]);

  useEffect(() => {
    if (membersApiRes?.data) {
      const rawData = membersApiRes.data as
        | { members: unknown[] }
        | { data: unknown[] }
        | unknown[];

      let membersArray: unknown[] = [];
      if (Array.isArray(rawData)) {
        membersArray = rawData;
      } else if ("members" in rawData && Array.isArray(rawData.members)) {
        membersArray = rawData.members;
      } else if ("data" in rawData && Array.isArray((rawData as { data: unknown[] }).data)) {
        membersArray = (rawData as { data: unknown[] }).data;
      }

      const mapped = membersArray.map((m) => {
        const member = m as {
          id?: number;
          member_code?: string;
          nik_nisn?: string;
          phone?: string;
          address?: string;
          total_loans?: number;
          created_at?: string;
          status?: string;
          avatar?: string;
          avatar_url?: string;
          name?: string;
          email?: string;
          id_type?: string;
          birth_date?: string;
          guardian_name?: string;
          guardian_nik?: string;
          guardian_phone?: string;
          user?: {
            name?: string;
            email?: string;
            role?: string;
            status?: string;
            avatar?: string;
            avatar_url?: string;
            phone?: string;
          };
        };
        const user = member.user ?? {};
        let rawAvatar = user.avatar_url || user.avatar || member.avatar_url || member.avatar || null;
        if (rawAvatar && !rawAvatar.startsWith('http') && !rawAvatar.startsWith('/images') && !rawAvatar.startsWith('data:')) {
          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
          rawAvatar = `${baseUrl}/${rawAvatar.replace(/^\//, '')}`;
        }
        
        return {
          id: member.member_code || member.nik_nisn || member.id?.toString() || "-",
          numericId: member.id || 0,
          name: user.name || member.name || "Tanpa Nama",
          email: user.email || member.email || "Tidak ada email",
          role: user.role || "Anggota",
          joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-",
          status: (user.status || member.status) === "active" ? "AKTIF" : (user.status || member.status) === "suspended" ? "DITANGGUHKAN" : "MENUNGGU",
          avatar: member.avatar ?? undefined,
          phone: member.phone || user.phone || "-",
          address: member.address || "",
          loans: member.total_loans || 0,
          initials: (user.name || member.name || "A").substring(0, 2).toUpperCase(),
          color: "bg-emerald-500",
          nik_nisn: member.nik_nisn || "",
          id_type: (member.id_type as "ktp" | "kk" | "kartu_pelajar") || "ktp",
          birth_date: member.birth_date || "",
          guardian_name: member.guardian_name || "",
          guardian_nik: member.guardian_nik || "",
          guardian_phone: member.guardian_phone || ""
        };
      });
      setMembersState(mapped);
    }
  }, [membersApiRes]);

  // Pagination Meta from API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiData = membersApiRes?.data as any;
  const paginationMeta = apiData?.pagination || apiData?.meta || apiData;
  const totalItems = paginationMeta?.total || 0;
  const totalPages = paginationMeta?.last_page || Math.ceil(totalItems / itemsPerPage) || 1;
  const fromIndex = paginationMeta?.from || (totalItems === 0 ? 0 : 1);
  const toIndex = paginationMeta?.to || (totalItems === 0 ? 0 : membersState.length);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; numericId: number; name: string } | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const handleToggleStatus = async (member: Anggota) => {
    const newStatus = member.status === "AKTIF" ? "inactive" : "active";
    try {
      await updateMemberApi({ id: member.numericId, status: newStatus }).unwrap();
    } catch (err) {
      console.error("Gagal mengubah status anggota:", err);
      setErrorMsg("Gagal mengubah status anggota.");
    }
  };



  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMemberApi(deleteTarget.numericId).unwrap();
      setDeleteTarget(null);
      setShowDeleteSuccess(true);
    } catch (err) {
      console.error("Delete member failed:", err);
      setDeleteError("Gagal menghapus anggota. Coba lagi.");
    }
  };

  let currentData = membersState;
  
  // Local Sorting just for UI if needed (though backend usually handles it)
  if (sortOrder === "terlama") {
    currentData = [...currentData].reverse();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Manajemen Anggota"
        subtitle="Mengelola data anggota perpustakaan"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Manajemen Anggota
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Kelola data lengkap keanggotaan dan pantau aktivitas peminjaman
              buku secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className="gap-2 text-[#99BD4A] border-[#99BD4A] hover:bg-[#99BD4A]/10 flex-1 md:flex-none"
              asChild
            >
              <Link href="/admin/anggota/reaktivasi">
                <RefreshCcw className="w-4 h-4" />
                Reaktivasi Akun
              </Link>
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-white flex-1 md:flex-none"
              asChild
            >
              <Link href="/admin/anggota/log">
                <FileText className="w-4 h-4" />
                Log Aktifitas
              </Link>
            </Button>
            <Button
              className="gap-2 bg-[#99BD4A] hover:bg-[#99BD4A]/80 flex-1 md:flex-none"
              asChild
            >
              <Link href="/admin/anggota/peninjauan">
                <UserPlus className="w-4 h-4" />
                Cek Pengajuan Anggota
              </Link>
            </Button>
            <Button
              className="gap-2 bg-[#99BD4A] hover:bg-[#99BD4A]/80 flex-1 md:flex-none"
              asChild
            >
              <Link href="/admin/anggota/tambah">
                <Plus className="w-4 h-4" />
                Tambah Anggota
              </Link>
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="search"
                  placeholder="Cari nama, email, atau ID anggota..."
                  className="pl-9 bg-slate-50/50"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px] bg-slate-50/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Status: Semua</SelectItem>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(val) => { setSortOrder(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px] bg-slate-50/50">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbaru">Urutkan: Terbaru</SelectItem>
                    <SelectItem value="terlama">Urutkan: Terlama</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[130px] bg-slate-50/50">
                    <SelectValue placeholder="Tampilkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Tampilkan: 5</SelectItem>
                    <SelectItem value="10">Tampilkan: 10</SelectItem>
                    <SelectItem value="20">Tampilkan: 20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      NAMA ANGGOTA
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      EMAIL
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      NO. WHATSAPP
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      STATUS
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      TOTAL PINJAMAN
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider text-right">
                      AKSI
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} className="py-4">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 w-1/4">
                              <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse shrink-0" />
                              <div className="space-y-2 w-full">
                                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                                <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                              </div>
                            </div>
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
                              <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        Tidak ada data anggota ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((member) => (
                      <TableRow key={member.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-emerald-500 flex items-center justify-center relative">
                            <span className="text-white font-bold text-sm absolute inset-0 flex items-center justify-center">{member.initials}</span>
                            {member.avatar && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-full h-full object-cover relative z-10"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {member.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {member.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {member.email}
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {member.phone}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${member.status === "AKTIF" ? "bg-green-500" : "bg-slate-400"}`}
                          ></span>
                          <span
                            className={`text-xs font-bold ${member.status === "AKTIF" ? "text-green-600" : "text-slate-500"}`}
                          >
                            {member.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900">
                          {member.loans} Buku
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Total Peminjaman
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          {/* Informasi */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 hover:text-[#99BD4A] hover:bg-[#99BD4A]/10"
                                asChild
                              >
                                <Link href={`/admin/anggota/${member.numericId}`}>
                                  <Info className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Informasi
                            </TooltipContent>
                          </Tooltip>

                          {/* Toggle Status */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`w-8 h-8 ${
                                  member.status === "AKTIF"
                                    ? "hover:text-amber-600 hover:bg-amber-50"
                                    : "hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                                onClick={() => handleToggleStatus(member)}
                              >
                                {member.status === "AKTIF" ? (
                                  <UserX className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-emerald-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {member.status === "AKTIF" ? "Nonaktifkan Anggota" : "Aktifkan Anggota"}
                            </TooltipContent>
                          </Tooltip>

                          {/* Edit */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 hover:text-slate-900 hover:bg-slate-100"
                                asChild
                              >
                                <Link href={`/admin/anggota/${member.numericId}?edit=true`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Edit
                            </TooltipContent>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteTarget({ id: member.id, numericId: member.numericId, name: member.name })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-red-600 text-white border-none">
                              Delete
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm font-medium text-slate-500 tracking-wider uppercase text-xs">
                MENAMPILKAN {totalItems === 0 ? 0 : fromIndex}-{toIndex} DARI {totalItems} ANGGOTA
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {generatePagination(currentPage, totalPages).map((page, i) => (
                  <Button
                    key={i}
                    variant={page === '...' ? "ghost" : currentPage === page ? "default" : "outline"}
                    size="sm"
                    disabled={page === '...'}
                    className={`w-8 h-8 ${page === '...' ? "cursor-default border-none hover:bg-transparent" : currentPage === page ? "bg-[#99BD4A] hover:bg-[#99BD4A]/80 text-white" : ""}`}
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
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ── Delete Confirmation Modal ── */}
      <StatusModal
        isOpen={!!deleteTarget}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(""); } }}
        status="failed"
        title="Hapus Data Anggota?"
        description={deleteError || `Anda akan menghapus data anggota atas nama "${deleteTarget?.name}" secara permanen. Tindakan ini tidak dapat dibatalkan.`}
        actionLabel={isDeleting ? "Menghapus..." : "Ya, Hapus"}
        cancelLabel="Batal"
        onAction={handleDeleteConfirm}
        isLoading={isDeleting}
      />


      {/* ── Delete Success Modal ── */}
      <StatusModal
        isOpen={showDeleteSuccess}
        onOpenChange={setShowDeleteSuccess}
        status="success"
        title="Data Anggota Berhasil Dihapus!"
        description="Data anggota telah dihapus dari sistem. Anggota tidak lagi dapat mengakses layanan perpustakaan."
        actionLabel="Tutup"
        onAction={() => setShowDeleteSuccess(false)}
      />

      {/* ── Error Modal ── */}
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
