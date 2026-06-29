"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Printer,
  Info,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Clock,
} from "lucide-react";
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
import Link from "next/link";
import { generatePagination } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useListBooksQuery, useDeleteBookMutation } from "@/services/books.service";

interface Buku {
  id: string;
  title: string;
  isbn: string;
  author: string;
  category: string;
  stock: number;
  status: string;
  coverColor: string;
  coverAccent: string;
  coverUrl?: string | null;
  book_type?: string;
}

export default function ManajemenBukuPage() {
  const { data: booksApiRes, isLoading, refetch } = useListBooksQuery({});
  const [deleteBook, { isLoading: isDeleting }] = useDeleteBookMutation();
  const [booksState, setBooksState] = useState<Buku[]>([]);

  useEffect(() => {
    if (booksApiRes?.data) {
      let booksArray = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = booksApiRes.data as any;
      if (Array.isArray(data)) {
        booksArray = data;
      } else if (data.books && Array.isArray(data.books)) {
        booksArray = data.books;
      } else if (data.data && Array.isArray(data.data)) {
        booksArray = data.data;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = booksArray.map((b: any) => ({
        id: b.id.toString(),
        title: b.title,
        isbn: b.isbn || "-",
        author: b.author || b.writer || "-",
        category: b.categories && b.categories.length > 0
          ? b.categories[0].name
          : typeof b.category === "string"
          ? b.category
          : (b.category as { name: string } | undefined)?.name ?? "Umum",
        book_type: b.book_type,
        stock: b.book_type === "digital" ? 0 : (b.available_copies ?? b.stock ?? 0),
        status: b.book_type === "digital" ? "Tersedia" : ((b.available_copies ?? b.stock ?? 0) > 0 ? "Tersedia" : "Habis"),
        coverColor: b.cover_color || "#385444",
        coverAccent: b.cover_accent || "#426152",
        coverUrl: b.cover_url || null,
      }));
      setBooksState(mapped);
    }
  }, [booksApiRes]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBook(deleteTarget.id).unwrap();
      refetch();
      setDeleteTarget(null);
      setShowDeleteSuccess(true);
    } catch (err) {
      console.error("Failed to delete book:", err);
      setErrorMsg("Gagal menghapus buku");
    }
  };

  // Calculate stats for summary cards
  const totalBuku = booksState.length;
  const tersedia = booksState.filter(b => b.status === "Tersedia").length;
  const dipinjam = booksState.filter(b => b.status.startsWith("Dipinjam")).length;

  // Filtering
  const filteredData = booksState.filter((buku) => {
    const matchesSearch =
      buku.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buku.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buku.isbn.includes(searchQuery);

    // Simplification for status filtering
    const matchesStatus =
      statusFilter === "semua" ||
      (statusFilter === "tersedia" && buku.status === "Tersedia") ||
      (statusFilter === "dipinjam" && buku.status.startsWith("Dipinjam")) ||
      (statusFilter === "habis" && buku.status === "Habis");

    // Simplification for category
    const matchesKategori =
      kategoriFilter === "semua" ||
      buku.category.toLowerCase().includes(kategoriFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesKategori;
  });

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusStyle = (status: string) => {
    if (status === "Tersedia") {
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        dot: "bg-emerald-500",
      };
    }
    if (status.startsWith("Dipinjam")) {
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        dot: "bg-amber-500",
      };
    }
    return {
      bg: "bg-red-50",
      text: "text-red-600",
      dot: "bg-red-500",
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Manajemen Data Buku"
        subtitle="Pantau dan verifikasi data buku di Perpustakaan"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Manajemen Data Buku Admin
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Kelola data inventaris buku perpustakaan Wadas Kelir secara
              efisien
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button className="gap-2 bg-[#a3c658] hover:bg-[#92b34f] text-white flex-1 md:flex-none font-semibold" asChild>
              <Link href="/admin/buku/barcode">
                <Printer className="w-4 h-4" />
                Cetak Barcode
              </Link>
            </Button>
            <Button className="gap-2 bg-[#99BD4A] hover:bg-[#88ab3d] text-white flex-1 md:flex-none font-semibold" asChild>
              <Link href="/admin/buku/tambah">
                <Plus className="w-4 h-4" />
                Tambah Buku
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters and Table Card */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="search"
                  placeholder="Cari judul, penulis, atau ISBN..."
                  className="pl-9 bg-slate-50/50"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={kategoriFilter}
                  onValueChange={(val) => {
                    setKategoriFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-slate-50/50">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Kategori: Semua</SelectItem>
                    <SelectItem value="kesusastraan">Kesusastraan</SelectItem>
                    <SelectItem value="filsafat">Filsafat</SelectItem>
                    <SelectItem value="sejarah">Sejarah</SelectItem>
                    <SelectItem value="psikologi">Psikologi</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-slate-50/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Status: Semua</SelectItem>
                    <SelectItem value="tersedia">Status: Tersedia</SelectItem>
                    <SelectItem value="dipinjam">Status: Dipinjam</SelectItem>
                    <SelectItem value="habis">Status: Habis</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(val) => {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                >
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

            <div className="rounded-md overflow-hidden overflow-x-auto smooth-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12">
                      COVER
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12">
                      JUDUL
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12">
                      PENULIS
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12">
                      KATEGORI DDC
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12 text-center">
                      STOK
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12">
                      STATUS
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12 text-right">
                      AKSI
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7} className="py-4">
                          <div className="flex items-center justify-between w-full">
                            <div className="w-10 h-12 bg-slate-200 rounded animate-pulse shrink-0" />
                            <div className="space-y-2 w-1/4">
                              <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                              <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                            </div>
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-12 mx-auto" />
                            <div className="h-6 bg-slate-200 rounded-full animate-pulse w-20" />
                            <div className="flex items-center justify-end gap-2 w-24">
                              <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
                              <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                        Tidak ada data buku ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((buku) => {
                      const statusStyle = getStatusStyle(buku.status);
                      return (
                        <TableRow
                        key={buku.id}
                        className="hover:bg-slate-50/50 border-b border-slate-100"
                      >
                        <TableCell className="py-4 align-middle">
                          <div className="w-12 h-16 rounded shadow-sm border border-slate-200 overflow-hidden relative flex items-center justify-center bg-white shrink-0">
                            {buku.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={buku.coverUrl}
                                alt={buku.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col justify-between"
                                style={{ background: `linear-gradient(160deg, ${buku.coverColor}, ${buku.coverAccent})` }}>
                                <div className="h-1.5 w-full opacity-40 bg-white/30" />
                                <div className="flex-1 flex items-center justify-center px-1">
                                  <span className="text-white/70 text-[8px] font-bold text-center leading-tight uppercase tracking-wide line-clamp-3">
                                    {buku.title}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="font-bold text-slate-900 text-sm">
                            {buku.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            ISBN: {buku.isbn}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium text-sm align-middle">
                          {buku.author}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold bg-[#99BD4A]/10 text-[#99BD4A]">
                            {buku.category}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-extrabold text-slate-900 text-base align-middle">
                          {buku.book_type === "digital" ? (
                            <span className="text-xl leading-none font-medium">∞</span>
                          ) : (
                            buku.stock
                          )}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                            ></span>
                            {buku.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-middle">
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
                                  <Link href={`/admin/buku/${buku.id}`}>
                                    <Info className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Informasi
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
                                  <Link href={`/admin/buku/${buku.id}?edit=true`}>
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Edit</TooltipContent>
                            </Tooltip>

                            {/* Delete */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 hover:text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: buku.id,
                                      title: buku.title,
                                    })
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-red-600 text-white border-none"
                              >
                                Delete
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm font-medium text-slate-500 tracking-wider uppercase text-xs">
                MENAMPILKAN {totalItems === 0 ? 0 : startIndex + 1} -{" "}
                {Math.min(startIndex + itemsPerPage, totalItems)} DARI {totalItems} BUKU
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-slate-100 bg-[#f4f7f0]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#99BD4A] flex items-center justify-center text-white shrink-0 shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{totalBuku}</p>
                <p className="text-sm font-semibold text-slate-600">
                  Total Koleksi Buku
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100 bg-[#eefaf4]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{tersedia}</p>
                <p className="text-sm font-semibold text-slate-600">
                  Buku Tersedia
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100 bg-[#fff8ef]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{dipinjam}</p>
                <p className="text-sm font-semibold text-slate-600">
                  Buku Dipinjam
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ── Delete Confirmation Modal ── */}
      <StatusModal
        isOpen={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        status="failed"
        title="Hapus Data Buku?"
        description={`Anda akan menghapus data buku "${deleteTarget?.title}" secara permanen. Tindakan ini tidak dapat dibatalkan.`}
        actionLabel="Ya, Hapus"
        cancelLabel="Batal"
        onAction={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* ── Delete Success Modal ── */}
      <StatusModal
        isOpen={showDeleteSuccess}
        onOpenChange={setShowDeleteSuccess}
        status="success"
        title="Berhasil Dihapus!"
        description="Data buku telah berhasil dihapus dari sistem."
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
