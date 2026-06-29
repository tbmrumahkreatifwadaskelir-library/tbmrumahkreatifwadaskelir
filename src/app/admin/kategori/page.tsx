"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusModal } from "@/components/ui/status-modal";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  BookOpen,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/services/categories.service";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  books_count: number;
}

export default function MasterKategoriPage() {
  const { data: categoriesRes, isLoading, refetch } = useListCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = categoriesRes?.data as any;
  const categories: Category[] = Array.isArray(rawData) ? rawData : [];

  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [wasEditing, setWasEditing] = useState(false); // track for success modal title
  const [errorMsg, setErrorMsg] = useState("");

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setEditTarget(null);
    setFormName("");
    setFormError("");
    setIsFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setFormName(cat.name);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("Nama kategori wajib diisi.");
      return;
    }
    setFormError("");
    try {
      const editing = !!editTarget;
      if (editTarget) {
        await updateCategory({ id: editTarget.id, data: { name: formName.trim() } }).unwrap();
      } else {
        await createCategory({ name: formName.trim() }).unwrap();
      }
      setIsFormOpen(false);
      setWasEditing(editing);
      setShowSaveSuccess(true);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setFormError(error?.data?.message || "Gagal menyimpan kategori.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id).unwrap();
      setDeleteTarget(null);
      setShowDeleteSuccess(true);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setDeleteTarget(null);
      setErrorMsg(error?.data?.message || "Gagal menghapus kategori.");
    }
  };

  const totalCategories = categories.length;
  const totalBooks = categories.reduce((sum, c) => sum + (c.books_count || 0), 0);
  const emptyCategories = categories.filter((c) => c.books_count === 0).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Master Data Kategori"
        subtitle="Kelola kategori koleksi buku perpustakaan"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Master Data Kategori
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Kelola kategori koleksi buku perpustakaan Wadas Kelir
            </p>
          </div>
          <Button
            className="gap-2 bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-semibold"
            onClick={openCreate}
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-slate-100 bg-[#f4f7f0]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-[#99BD4A] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{totalCategories}</p>
                <p className="text-sm font-semibold text-slate-600">Total Kategori</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100 bg-[#eefaf4]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{totalBooks}</p>
                <p className="text-sm font-semibold text-slate-600">Total Buku Terkategori</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100 bg-[#fff8ef]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{emptyCategories}</p>
                <p className="text-sm font-semibold text-slate-600">Kategori Kosong</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            {/* Search */}
            <div className="relative mb-6 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="search"
                placeholder="Cari nama atau slug kategori..."
                className="pl-9 bg-slate-50/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="rounded-md overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12 w-12">
                      NO
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12">
                      NAMA KATEGORI
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12">
                      SLUG
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12 text-center">
                      JUMLAH BUKU
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase h-12 text-right">
                      AKSI
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-4 bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-40" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-32" />
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-16 mx-auto" />
                            <div className="flex gap-2 ml-auto">
                              <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
                              <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Tag className="w-10 h-10 opacity-30" />
                          <p className="font-medium">
                            {searchQuery ? "Tidak ada kategori yang cocok." : "Belum ada kategori."}
                          </p>
                          {!searchQuery && (
                            <Button
                              size="sm"
                              onClick={openCreate}
                              className="bg-[#99BD4A] hover:bg-[#88ab3d] text-white mt-2"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Tambah Pertama
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((cat, index) => (
                      <TableRow
                        key={cat.id}
                        className="hover:bg-slate-50/50 border-b border-slate-100"
                      >
                        <TableCell className="text-slate-500 font-medium text-sm align-middle">
                          {index + 1}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#99BD4A]/10 flex items-center justify-center shrink-0">
                              <Tag className="w-4 h-4 text-[#99BD4A]" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm">
                              {cat.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">
                            {cat.slug}
                          </code>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              cat.books_count > 0
                                ? "bg-[#99BD4A]/10 text-[#99BD4A]"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {cat.books_count} buku
                          </span>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 hover:text-slate-900 hover:bg-slate-100"
                                  onClick={() => openEdit(cat)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteTarget(cat)}
                                  disabled={cat.books_count > 0}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className={cat.books_count > 0 ? "" : "bg-red-600 text-white border-none"}
                              >
                                {cat.books_count > 0
                                  ? `Tidak bisa dihapus (${cat.books_count} buku)`
                                  : "Hapus"}
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

            {/* Footer info */}
            {!isLoading && filteredCategories.length > 0 && (
              <div className="mt-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Menampilkan {filteredCategories.length} dari {categories.length} kategori
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ── Form Dialog (Create / Edit) ── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editTarget ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Nama Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormError("");
                }}
                placeholder="Contoh: Sastra & Puisi"
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                autoFocus
              />
              {formError && (
                <p className="text-xs text-red-500 font-medium">{formError}</p>
              )}
              <p className="text-[11px] text-slate-400">
                Slug akan dibuat otomatis dari nama kategori oleh sistem.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="border-slate-200 text-slate-600"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isCreating || isUpdating}
              className="bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold gap-2"
            >
              {(isCreating || isUpdating) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                editTarget ? "Simpan Perubahan" : "Tambah Kategori"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ── */}
      <StatusModal
        isOpen={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        status="reject"
        title="Hapus Kategori?"
        description={`Anda akan menghapus kategori "${deleteTarget?.name}". Tindakan ini tidak dapat dibatalkan.`}
        actionLabel="Ya, Hapus"
        cancelLabel="Batal"
        onAction={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* ── Save Success Modal ── */}
      <StatusModal
        isOpen={showSaveSuccess}
        onOpenChange={setShowSaveSuccess}
        status="success"
        title={wasEditing ? "Kategori Diperbarui!" : "Kategori Ditambahkan!"}
        description={wasEditing
          ? "Data kategori berhasil diperbarui."
          : "Kategori baru berhasil ditambahkan ke sistem."}
        actionLabel="Tutup"
        onAction={() => setShowSaveSuccess(false)}
      />

      {/* ── Delete Success Modal ── */}
      <StatusModal
        isOpen={showDeleteSuccess}
        onOpenChange={setShowDeleteSuccess}
        status="success"
        title="Kategori Dihapus!"
        description="Kategori berhasil dihapus dari sistem."
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
