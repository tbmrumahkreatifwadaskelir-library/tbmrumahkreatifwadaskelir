"use client";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusModal } from "@/components/ui/status-modal";
import { ArrowLeft, UploadCloud, FileImage, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { useCreateEventMutation } from "@/services/events.service";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TambahKegiatanPage() {
  const router = useRouter();
  const [createEventApi, { isLoading: isCreating }] = useCreateEventMutation();

  const getLocalIsoString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: "",
    event_type: "",
    event_time: getLocalIsoString(),
    event_time_display: "",
    location: "",
    summary: "",
    content: "",
  });

  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "success" as "success" | "failed", title: "", desc: "" });

  const handleFileSelection = (file: File) => {
    if (file.type.startsWith("image/")) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setStatusMessage({ type: "failed", title: "Format Tidak Valid", desc: "Hanya file gambar yang diperbolehkan." });
      setShowStatusModal(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setCoverFile(null);
    setCoverPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      const finalCategory = selectedCategory === "Lainnya" ? customCategory : selectedCategory;
      payload.append("event_type", finalCategory || formData.event_type);
      payload.append("event_time", formData.event_time);
      payload.append("event_time_display", formData.event_time_display);
      payload.append("location", formData.location);
      payload.append("summary", formData.summary);
      payload.append("content", formData.content);
      
      if (coverFile) {
        payload.append("cover", coverFile);
      }

      await createEventApi(payload).unwrap();
      
      setStatusMessage({ type: "success", title: "Berhasil Ditambahkan", desc: "Kegiatan baru berhasil dibuat." });
      setShowStatusModal(true);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "failed", title: "Gagal Menyimpan", desc: "Terjadi kesalahan saat menyimpan data." });
      setShowStatusModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowStatusModal(false);
    if (statusMessage.type === "success") {
      router.push("/admin/kegiatan");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] pb-20">
      <SiteHeader title="Tambah Kegiatan" subtitle="Buat kegiatan baru ILMS" />
      
      <main className="flex-1 w-full mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <Link href="/admin/kegiatan" className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Kegiatan
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-2xl font-bold text-[#232b39]">Detail Kegiatan Baru</h1>
            <p className="text-slate-500 mt-1 text-sm">Lengkapi seluruh informasi di bawah ini untuk menerbitkan kegiatan.</p>
          </div>

          <form onSubmit={handleFormSubmit} className="p-8 space-y-8">
            
            {/* Image Upload Area */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-800">Banner / Gambar Cover <span className="text-rose-500">*</span></Label>
              <p className="text-sm text-slate-500">Unggah poster kegiatan (rasio 16:9 direkomendasikan). Format JPG atau PNG. Wajib dibawah 2mb</p>
              
              {!coverPreview ? (
                <div 
                  className={`relative w-full h-[240px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${isDragging ? 'border-[#99BD4A] bg-[#f6f8f1]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-[#99BD4A]">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-800 font-bold mb-1">Pilih File atau Tarik & Lepas</h3>
                  <p className="text-slate-500 text-sm">Maksimal ukuran file 2MB</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              ) : (
                <div className="relative w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group aspect-[21/9] md:aspect-[16/9]">
                  <Image src={coverPreview} alt="Cover Preview" fill className="object-cover opacity-90" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      <FileImage className="w-4 h-4 mr-2" /> Ganti Gambar
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleRemoveImage}>
                      <X className="w-4 h-4 mr-2" /> Hapus
                    </Button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Judul Kegiatan <span className="text-rose-500">*</span></Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Workshop Menulis Kreatif" className="h-12 rounded-xl bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Kategori / Jenis <span className="text-rose-500">*</span></Label>
                <div className="space-y-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full !h-12 rounded-xl bg-slate-50/50">
                      <SelectValue placeholder="Pilih kategori kegiatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Literasi">Literasi</SelectItem>
                      <SelectItem value="Seni & Budaya">Seni & Budaya</SelectItem>
                      <SelectItem value="Edukasi">Edukasi</SelectItem>
                      <SelectItem value="Berita & Pengumuman">Berita & Pengumuman</SelectItem>
                      <SelectItem value="Workshop & Pelatihan">Workshop & Pelatihan</SelectItem>
                      <SelectItem value="Lainnya">Lainnya...</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedCategory === "Lainnya" && (
                    <Input 
                      required 
                      value={customCategory} 
                      onChange={e => setCustomCategory(e.target.value)} 
                      placeholder="Tuliskan kategori kustom..." 
                      className="h-12 rounded-xl bg-slate-50/50 animate-in fade-in zoom-in-95 duration-200" 
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Tanggal dan Waktu Pelaksanaan Kegiatan <span className="text-rose-500">*</span></Label>
                <Input type="datetime-local" required value={formData.event_time_display} onChange={e => setFormData({...formData, event_time_display: e.target.value})} className="h-12 rounded-xl bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Waktu Publish <span className="text-rose-500">*</span></Label>
                <Input type="datetime-local" readOnly disabled value={formData.event_time} className="h-12 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" />
                <p className="text-xs text-slate-500">Otomatis menggunakan waktu hari ini dan tidak dapat diubah.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Lokasi <span className="text-rose-500">*</span></Label>
              <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Contoh: Aula Wadas Kelir" className="h-12 rounded-xl bg-slate-50/50" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Ringkasan Singkat (Summary) <span className="text-rose-500">*</span></Label>
              <Input required value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} placeholder="Tuliskan 1-2 kalimat pemikat..." className="h-12 rounded-xl bg-slate-50/50" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Isi Kegiatan Lengkap <span className="text-rose-500">*</span></Label>
              <Textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Jabarkan agenda secara detail di sini..." className="min-h-[200px] rounded-xl bg-slate-50/50 p-4" />
            </div>

            <div className="pt-6 border-t flex items-center justify-end gap-4">
              <Link href="/admin/kegiatan">
                <Button type="button" variant="ghost" className="px-6 rounded-xl h-12">Batal</Button>
              </Link>
              <Button type="submit" disabled={isCreating} className="bg-[#99BD4A] hover:bg-[#85a63e] text-white px-8 h-12 rounded-xl text-[15px] font-bold shadow-sm">
                {isCreating ? "Menerbitkan..." : "Terbitkan Kegiatan"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <StatusModal
        isOpen={showStatusModal}
        onOpenChange={(val) => !val && handleCloseModal()}
        status={statusMessage.type}
        title={statusMessage.title}
        description={statusMessage.desc}
        actionLabel="Selesai"
        onAction={handleCloseModal}
      />
    </div>
  );
}
