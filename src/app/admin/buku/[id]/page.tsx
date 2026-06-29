"use client";

import { use, useState, useRef, ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusModal } from "@/components/ui/status-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, Info, CheckCircle2, Wand2, Search, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useBookDetailQuery, useCreateBookMutation, useUpdateBookMutation, useDeleteBookReviewMutation } from "@/services/books.service";
import { useListCategoriesQuery } from "@/services/categories.service";

interface PerpusnasBook {
  title: string;
  isbn?: string;
  code?: string;
  kepeng?: string;
  nama_penerbit?: string;
  tahun_terbit?: string;
}

export default function BukuFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = use(params);
  const { edit } = use(searchParams);
  const router = useRouter();
  
  const isAddMode = id === "tambah";
  const decodedId = decodeURIComponent(id);
  
  const { data: bookDetailRes } = useBookDetailQuery(decodedId, { skip: isAddMode || !decodedId });

  // Default mode state based on whether book exists
  const [isReadOnly, setIsReadOnly] = useState(!isAddMode && edit !== "true");

  // Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [ddc, setDdc] = useState("");
  const [isbn, setIsbn] = useState("");
  const [bookCode, setBookCode] = useState("BK-NEW-0000");
  const [categoryId, setCategoryId] = useState<string>(""); // ID kategori dari DB
  const [type, setType] = useState(""); // "physical" | "digital"
  const [stock, setStock] = useState("0");
  const [available, setAvailable] = useState("0");
  const [description, setDescription] = useState("");
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [digitalFileUrl, setDigitalFileUrl] = useState<string | null>(null);
  const [defaultAccessDays, setDefaultAccessDays] = useState("14");

  // Fetch daftar kategori dari API
  const { data: categoriesRes } = useListCategoriesQuery();
  // /api/categories returns data as a direct array
  const rawCatData = categoriesRes?.data as Record<string, unknown> | { id: number; name: string }[] | undefined;
  const categoryOptions: { id: number; name: string }[] = Array.isArray(rawCatData)
    ? rawCatData as { id: number; name: string }[]
    : (rawCatData as Record<string, unknown>)?.categories as { id: number; name: string }[] ?? [];

  useEffect(() => {
    if (bookDetailRes?.data) {
      const book = bookDetailRes.data as Record<string, unknown>;
      setTitle((book.title as string) || "");
      setAuthor((book.author as string) || "");
      setPublisher((book.publisher as string) || "");
      setYear((book.publish_year as string) || (book.year_published as string) || "");
      setDdc((book.ddc_code as string) || ((book.category as Record<string, unknown>)?.name as string) || "");
      setIsbn((book.isbn as string) || "");
      setBookCode((book.book_code as string) || "BK-NEW-0000");
      setType((book.book_type as string) || "");
      // Ambil ID kategori pertama dari array categories
      const cats = book.categories as Array<{ id: number }> | undefined;
      if (cats && cats.length > 0) {
        setCategoryId(String(cats[0].id));
      }
      setStock(String((book.total_copies as number) || 0));
      setAvailable(String((book.available_copies as number) || 0));
      setDescription((book.description as string) || "");
      
      if (book.cover_url) {
        setCoverPreview(book.cover_url as string);
      }
      if (book.file_path) {
        setDigitalFileUrl(book.file_path as string);
      }
    }
  }, [bookDetailRes]);

  const [deleteBookReview] = useDeleteBookReviewMutation();

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverClick = () => {
    if (!isReadOnly && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  const handleDigitalFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDigitalFile(file);
  };

  const [createBook] = useCreateBookMutation();
  const [updateBook] = useUpdateBookMutation();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuggestingDdc, setIsSuggestingDdc] = useState(false);
  const [isSuggestingIsbn, setIsSuggestingIsbn] = useState(false);
  const [isbnSuggestions, setIsbnSuggestions] = useState<PerpusnasBook[]>([]);
  const [isIsbnModalOpen, setIsIsbnModalOpen] = useState(false);

  const handleSuggestDdc = async () => {
    if (!title && !categoryId) {
      alert("Mohon isi judul buku atau pilih kategori terlebih dahulu.");
      return;
    }
    setIsSuggestingDdc(true);
    try {
      const catName = categoryOptions.find((c) => String(c.id) === categoryId)?.name || "";
      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ||
        "https://api.tbmrumahkreatifwadaskelir.com/api"
      ).replace(/\/$/, "");
      
      // Attempt 1: Search by title + category
      let searchParam = `${title} ${catName}`.trim();
      let response = await fetch(`${apiUrl}/ddc/suggest?q=${encodeURIComponent(searchParam)}`);
      let data = await response.json();
      let suggestions = data.data || [];

      // Attempt 2: If empty and title was provided, fallback to category name only
      if (suggestions.length === 0 && catName) {
        searchParam = catName;
        response = await fetch(`${apiUrl}/ddc/suggest?q=${encodeURIComponent(searchParam)}`);
        data = await response.json();
        suggestions = data.data || [];
      }

      if (suggestions.length > 0) {
        setDdc(suggestions[0].code);
      } else {
        alert(`Saran DDC tidak ditemukan untuk: ${title || catName}. Silakan isi manual.`);
      }
    } catch (err) {
      console.error("Gagal mendapatkan saran DDC:", err);
      alert("Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsSuggestingDdc(false);
    }
  };

  const handleSuggestIsbn = async () => {
    if (!title.trim()) {
      alert("Mohon isi judul lengkap buku terlebih dahulu.");
      return;
    }
    setIsSuggestingIsbn(true);
    try {
      const session = await getSession();
      const token = session?.user?.token;

      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ||
        "https://api.tbmrumahkreatifwadaskelir.com/api"
      ).replace(/\/$/, "");
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/admin/isbn/suggest?search=${encodeURIComponent(title)}`, {
        headers
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server.");
      }

      const resJson = await response.json();
      const rawData = resJson?.data?.data || resJson?.data || [];
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        setIsbnSuggestions(rawData);
        setIsIsbnModalOpen(true);
      } else {
        alert(`Data ISBN tidak ditemukan untuk judul "${title}". Silakan periksa kembali judul atau isi manual.`);
      }
    } catch (err) {
      console.error("Gagal mendapatkan saran ISBN:", err);
      alert("Terjadi kesalahan saat mencari data ISBN di Perpusnas.");
    } finally {
      setIsSuggestingIsbn(false);
    }
  };

  const handleSelectBookFromIsbn = (book: PerpusnasBook) => {
    if (book.isbn || book.code) {
      setIsbn(book.isbn || book.code || "");
    }
    if (book.title) {
      setTitle(book.title);
    }
    if (book.kepeng) {
      const cleanAuthor = book.kepeng.split(";")[0].trim();
      setAuthor(cleanAuthor);
    }
    if (book.nama_penerbit) {
      setPublisher(book.nama_penerbit);
    }
    if (book.tahun_terbit) {
      setYear(book.tahun_terbit);
    }
    setIsIsbnModalOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("publisher", publisher);
      if (year) formData.append("publish_year", year);
      if (ddc) formData.append("ddc_code", ddc);
      if (isbn) formData.append("isbn", isbn);
      if (type !== "digital") {
        formData.append("total_copies", stock);
      }
      if (description) formData.append("description", description);
      if (type) formData.append("book_type", type);
      if (categoryId) formData.append("categories[]", categoryId);
      
      if (type === "digital") {
        formData.append("default_access_days", defaultAccessDays);
        if (digitalFile) formData.append("digital_file", digitalFile);
      }

      // If user uploaded a new cover, append it
      if (fileInputRef.current?.files?.[0]) {
        formData.append("cover", fileInputRef.current.files[0]);
      }

      if (isAddMode) {
        await createBook(formData).unwrap();
      } else {
        formData.append("_method", "PUT");
        await updateBook({ id: decodedId, data: formData }).unwrap();
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to save book:", err);
      setErrorMsg("Gagal menyimpan data buku");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Hapus ulasan ini?")) return;
    try {
      await deleteBookReview(reviewId).unwrap();
      alert("Ulasan berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus ulasan:", err);
      alert("Gagal menghapus ulasan.");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/admin/buku");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Manajemen Data Buku"
        subtitle="Cetak barcode buku sesuai dengan OPAC"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb & Title */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Link href="/admin/buku" className="hover:text-slate-900 transition-colors">
                Manajemen Buku
              </Link>
              <span className="text-[#99BD4A]">›</span>
              <span className="text-[#99BD4A]">
                {isAddMode ? "Tambah Buku Baru" : isReadOnly ? "Informasi Buku" : "Edit Buku"}
              </span>
            </div>
            
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isAddMode ? "Pendaftaran Volume Baru" : isReadOnly ? "Informasi Volume" : "Edit Volume Buku"}
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Unit Kearsipan Editorial — Rumah Kreatif Wadas Kelir
              </p>
            </div>
          </div>

          {!isAddMode && isReadOnly && (
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsReadOnly(false)}
                className="bg-[#99BD4A] hover:bg-[#88ab3d] text-white"
              >
                Edit Data Buku
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-4 space-y-8">
              {/* Sampul Buku */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[#99BD4A] rounded-full"></span>
                  Sampul Buku
                </h3>
                <div 
                  className={`bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl aspect-[3/4] flex flex-col items-center justify-center p-6 text-center transition-colors relative overflow-hidden ${!isReadOnly ? 'hover:bg-slate-100 cursor-pointer group' : ''}`}
                  onClick={handleCoverClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCoverChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    disabled={isReadOnly}
                  />
                  {coverPreview ? (
                    <Image 
                      src={coverPreview} 
                      alt="Cover Preview" 
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6 text-[#99BD4A]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">
                        {isReadOnly ? "Tidak ada cover" : "Pilih Cover Buku"}
                      </h4>
                      {!isReadOnly && (
                        <p className="text-[11px] font-medium text-slate-400">
                          Format JPG atau PNG (Maksimal 5MB)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Meta Data */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[#99BD4A] rounded-full"></span>
                  Meta Data
                </h3>
                <Card className="border-none shadow-none bg-transparent">
                  <CardContent className="p-0 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Kode Buku
                      </Label>
                      <Input
                        readOnly
                        value={bookCode}
                        className="bg-[#f8fcf3] border-[#e2e8f0] text-[#99BD4A] font-bold h-11 focus-visible:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        ISBN
                      </Label>
                      <div className="relative">
                        <Input
                          readOnly={isReadOnly}
                          value={isbn}
                          onChange={(e) => setIsbn(e.target.value)}
                          placeholder="Contoh: 978-3-16-148410-0"
                          className="bg-slate-50/80 border-slate-200 h-11 pr-10 text-slate-600 font-medium focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={handleSuggestIsbn}
                            disabled={isSuggestingIsbn}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#99BD4A] hover:bg-[#99BD4A]/10 rounded-full transition-colors group"
                            title="Cari ISBN otomatis"
                          >
                            {isSuggestingIsbn ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#99BD4A]" />
                            ) : (
                              <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            )}
                            <span className="sr-only">Cari ISBN otomatis</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="lg:col-span-8 space-y-8">
              {/* Informasi Dasar */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-5 bg-[#99BD4A] rounded-full"></span>
                  Informasi Dasar
                </h3>
                
                <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Judul Lengkap Buku
                    </Label>
                    <Input
                      readOnly={isReadOnly}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Masukkan judul lengkap sesuai cover..."
                      className="bg-slate-50/80 border-slate-200 h-12 text-slate-800 font-medium focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Penulis / Pengarang
                      </Label>
                      <Input
                        readOnly={isReadOnly}
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Nama penulis utama"
                        className="bg-slate-50/80 border-slate-200 h-11 text-slate-800 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Penerbit
                      </Label>
                      <Input
                        readOnly={isReadOnly}
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        placeholder="Nama perusahaan penerbit"
                        className="bg-slate-50/80 border-slate-200 h-11 text-slate-800 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Tahun Terbit
                      </Label>
                      <Input
                        readOnly={isReadOnly}
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="2023"
                        className="bg-slate-50/80 border-slate-200 h-11 text-slate-800 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Kode DDC
                      </Label>
                      <div className="relative">
                        <Input
                          readOnly={isReadOnly}
                          value={ddc}
                          onChange={(e) => setDdc(e.target.value)}
                          placeholder="Contoh: 800 (Sastra)"
                          className="bg-slate-50/80 border-slate-200 h-11 pr-10 text-slate-800 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={handleSuggestDdc}
                            disabled={isSuggestingDdc}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#99BD4A] hover:bg-[#99BD4A]/10 rounded-full transition-colors group"
                            title="DDC otomatis"
                          >
                            <Wand2 className={`w-4 h-4 ${isSuggestingDdc ? 'animate-pulse text-[#99BD4A]' : ''}`} />
                            <span className="sr-only">DDC otomatis</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kategori & Inventaris */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-5 bg-[#99BD4A] rounded-full"></span>
                  Kategori & Inventaris
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Kategori Koleksi
                    </Label>
                    <Select disabled={isReadOnly} value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="w-full bg-slate-50/80 border-slate-200 h-11 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.length === 0 ? (
                          <SelectItem value="__loading" disabled>Memuat kategori...</SelectItem>
                        ) : (
                          categoryOptions.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Tipe Buku
                    </Label>
                    <Select disabled={isReadOnly} value={type} onValueChange={setType}>
                      <SelectTrigger className="w-full bg-slate-50/80 border-slate-200 h-11 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Fisik</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Total Stok (Eksemplar)
                    </Label>
                    <Input
                      readOnly={isReadOnly || type === "digital"}
                      value={type === "digital" ? "∞" : stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="10"
                      className={`h-11 text-slate-800 ${type === "digital" ? "bg-slate-100 text-slate-500 text-lg cursor-not-allowed border-slate-200" : "bg-slate-50/80 border-slate-200 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Tersedia Untuk Dipinjam
                    </Label>
                    <Input
                      readOnly
                      value={type === "digital" ? "∞" : available}
                      placeholder="10"
                      className={`border-[#e2e8f0] font-medium h-11 cursor-not-allowed ${type === "digital" ? "bg-slate-100 text-slate-500 text-lg" : "bg-[#f8fcf3] text-slate-600"}`}
                    />
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {type === "digital" ? "Buku digital dapat dipinjam tanpa batas." : "Otomatis dihitung dari stok dikurangi yang sedang dipinjam."}
                    </p>
                  </div>
                  
                  {type === "digital" ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          File Digital (PDF/EPUB)
                        </Label>
                        <Input
                          type="file"
                          accept=".pdf,.epub,.cbz,.zip"
                          disabled={isReadOnly}
                          onChange={handleDigitalFileChange}
                          className="bg-slate-50/80 border-slate-200 h-11 p-0 text-slate-500 cursor-pointer file:h-11 file:mr-4 file:py-0 file:px-6 file:rounded-l-md file:rounded-r-none file:border-0 file:text-sm file:font-semibold file:bg-[#99BD4A] file:text-white hover:file:bg-[#88ab3d] file:cursor-pointer transition-colors"
                        />
                        {digitalFileUrl ? (
                          <div className="text-xs text-[#99BD4A] flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            File digital telah diunggah.
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Akses Maksimal (Hari)
                        </Label>
                        <Input
                          type="number"
                          readOnly={isReadOnly}
                          value={defaultAccessDays}
                          onChange={(e) => setDefaultAccessDays(e.target.value)}
                          placeholder="14"
                          className="bg-slate-50/80 border-slate-200 h-11 text-slate-800 focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Deskripsi & Sinopsis */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-5 bg-[#99BD4A] rounded-full"></span>
                  Deskripsi & Sinopsis
                </h3>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <Textarea
                    readOnly={isReadOnly}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tuliskan rangkuman isi buku atau catatan editorial di sini..."
                    className="bg-slate-50/80 border-slate-200 min-h-[120px] resize-none focus-visible:ring-[#99BD4A]/40 focus-visible:border-[#99BD4A]"
                  />
                </div>
              </div>

              {/* Ulasan Buku (Khusus Edit Mode) */}
              {!isAddMode && Boolean(bookDetailRes?.data) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-5 bg-[#99BD4A] rounded-full"></span>
                    Moderasi Ulasan (Reviews)
                  </h3>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 max-h-[300px] overflow-y-auto">
                    {(() => {
                      const reviewsList = (bookDetailRes?.data as Record<string, unknown>).reviews as Array<Record<string, unknown>> | undefined;
                      if (!reviewsList || reviewsList.length === 0) {
                        return <p className="text-sm text-slate-500 text-center py-4">Belum ada ulasan untuk buku ini.</p>;
                      }
                      return (
                        <>
                          {reviewsList.map((review) => {
                            const rId = review.id as number;
                            const rMember = review.member as { name?: string } | undefined;
                            const rRating = review.rating as number;
                            const rReview = review.review as string;
                            const rDate = review.created_at as string;
                            return (
                              <div key={rId} className="flex justify-between items-start border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-slate-800">{rMember?.name || "Anonim"}</span>
                                    <span className="text-xs text-amber-500 font-bold">★ {rRating}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 line-clamp-2">{rReview}</p>
                                  <span className="text-[10px] text-slate-400 mt-1 block">
                                    {new Date(rDate).toLocaleDateString()}
                                  </span>
                                </div>
                                {!isReadOnly && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleDeleteReview(rId)}
                                    className="h-7 text-[10px] px-2"
                                  >
                                    Hapus
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              {!isReadOnly && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-8">
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100/50 px-4 py-2 rounded-lg w-full sm:w-auto">
                    <Info className="w-4 h-4 text-[#99BD4A]" />
                    Data buku akan masuk ke dalam database ILMS.
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto px-8 h-12 font-bold border-slate-200 text-slate-600"
                      asChild
                    >
                      <Link href="/admin/buku">Batalkan</Link>
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-8 h-12 bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold gap-2 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Simpan Buku
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Success Modal ── */}
      <StatusModal
        isOpen={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        status="success"
        title={isAddMode ? "Berhasil Menambahkan Buku!" : "Berhasil Mengubah Buku!"}
        description={isAddMode ? "Buku baru telah berhasil disimpan ke dalam katalog perpustakaan." : "Data buku berhasil diperbarui."}
        actionLabel="Kembali ke Daftar"
        onAction={handleSuccessClose}
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

      {/* ── ISBN Suggestion Selection Dialog ── */}
      <Dialog open={isIsbnModalOpen} onOpenChange={setIsIsbnModalOpen}>
        <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#99BD4A]" />
              Pilih Data Buku dari Perpusnas
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Ditemukan beberapa data buku untuk kata kunci: <strong className="text-slate-800">&quot;{title}&quot;</strong>.
              Silakan pilih salah satu untuk menyalin data ISBN dan informasi buku lainnya secara otomatis.
            </p>

            <div className="space-y-3 divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
              {isbnSuggestions.map((item, idx) => (
                <div 
                  key={idx} 
                  className="pt-3 first:pt-0 pb-3 flex items-start justify-between gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  onClick={() => handleSelectBookFromIsbn(item)}
                >
                  <div className="space-y-1.5 flex-1 text-left">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#99BD4A] transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <div>
                        <span className="text-slate-400">Penulis:</span> {item.kepeng || "-"}
                      </div>
                      <div>
                        <span className="text-slate-400">Penerbit:</span> {item.nama_penerbit || "-"}
                      </div>
                      <div>
                        <span className="text-slate-400">Tahun:</span> {item.tahun_terbit || "-"}
                      </div>
                      <div>
                        <span className="text-slate-400">ISBN:</span> <strong className="text-slate-700">{item.isbn || item.code || "-"}</strong>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 font-bold text-[11px] border-slate-200 text-slate-600 hover:bg-[#99BD4A] hover:text-white hover:border-[#99BD4A]"
                  >
                    Pilih
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
