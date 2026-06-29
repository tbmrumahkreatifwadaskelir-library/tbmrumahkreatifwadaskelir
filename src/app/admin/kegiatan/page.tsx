"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar, Edit, Trash2, MapPin, ChevronLeft, ChevronRight, Image as ImageIcon, MessageSquare } from "lucide-react";
import Link from "next/link";
import { generatePagination } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusModal } from "@/components/ui/status-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { 
  useListEventsQuery, 
  useUpdateEventMutation, 
  useDeleteEventMutation 
} from "@/services/events.service";
import Image from "next/image";

interface Kegiatan {
  id: string;
  numericId: number;
  title: string;
  category: string;
  eventTime: string;
  eventTimeDisplay: string;
  location: string;
  summary: string;
  content: string;
  cover_url?: string;
  status: string; // Akan datang, Selesai, dll
}

export default function ManajemenKegiatanPage() {
  const { data: eventsApiRes, isLoading } = useListEventsQuery();
  const [updateEventApi, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEventApi, { isLoading: isDeleting }] = useDeleteEventMutation();
  
  const [eventsState, setEventsState] = useState<Kegiatan[]>([]);

  useEffect(() => {
    if (eventsApiRes?.data) {
      type ApiEventItem = {
        id?: number | string;
        title?: string;
        event_time?: string;
        event_time_display?: string;
        event_type?: string;
        summary?: string;
        image?: string;
        cover_path?: string;
        cover?: string;
        cover_url?: string;
        created_at?: string;
        location?: string;
        content?: string;
      };

      const rawData = eventsApiRes.data as { data?: ApiEventItem[]; events?: ApiEventItem[] } | ApiEventItem[];
      let eventsArray: ApiEventItem[] = [];
      if (Array.isArray(rawData)) {
        eventsArray = rawData;
      } else if (rawData && "data" in rawData && Array.isArray(rawData.data)) {
        eventsArray = rawData.data;
      } else if (rawData && "events" in rawData && Array.isArray(rawData.events)) {
        eventsArray = rawData.events;
      }

      const mapped = eventsArray.map((item: ApiEventItem) => {
        const rawImg = item.cover_url || item.image || item.cover_path || item.cover;
        const finalImg = rawImg 
          ? (rawImg.startsWith('http') ? rawImg : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) 
          : "";
          
        return {
          id: item.id?.toString() || "",
          numericId: typeof item.id === 'number' ? item.id : parseInt(item.id || "0", 10),
          title: item.title || "Tanpa Judul",
          category: item.event_type || "Seni & Budaya",
          eventTime: item.event_time || "",
          eventTimeDisplay: item.event_time_display || item.event_time || "",
          location: item.location || "Aula Wadas Kelir",
          summary: item.summary || "",
          content: item.content || "",
          cover_url: finalImg,
          status: new Date(item.event_time || "") > new Date() ? "Akan Datang" : "Selesai"
        };
      });
      // sort by newest
      mapped.sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());
      setEventsState(mapped);
    }
  }, [eventsApiRes]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    event_type: "Literasi",
    event_time: "",
    event_time_display: "",
    location: "Aula Wadas Kelir",
    summary: "",
    content: ""
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; numericId: number; title: string } | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "success" as "success" | "failed", title: "", desc: "" });

  const resetForm = () => {
    setFormData({
      id: 0,
      title: "",
      event_type: "",
      event_time: "",
      event_time_display: "",
      location: "Aula Wadas Kelir",
      summary: "",
      content: ""
    });
    setCoverFile(null);
    setCoverPreview("");
  };

  const handleOpenEdit = (event: Kegiatan) => {
    resetForm();
    setFormData({
      id: event.numericId,
      title: event.title,
      event_type: event.category,
      event_time: event.eventTime,
      event_time_display: event.eventTimeDisplay,
      location: event.location,
      summary: event.summary,
      content: event.content
    });
    setCoverPreview(event.cover_url || "");
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("event_type", formData.event_type);
      payload.append("event_time", formData.event_time);
      payload.append("event_time_display", formData.event_time_display);
      payload.append("location", formData.location);
      payload.append("summary", formData.summary);
      payload.append("content", formData.content);
      
      if (coverFile) {
        payload.append("cover", coverFile);
      }

      if (isEditMode) {
        // Untuk method PUT biasanya disiasati dengan POST + _method=PUT di Laravel jika ada file
        if (coverFile) {
          payload.append("_method", "PUT");
          await updateEventApi({ id: formData.id, data: payload }).unwrap();
        } else {
           // jika tidak ada file, kita bisa kirim json
           const jsonPayload = {
             title: formData.title,
             event_type: formData.event_type,
             event_time: formData.event_time,
             event_time_display: formData.event_time_display,
             location: formData.location,
             summary: formData.summary,
             content: formData.content,
           };
           await updateEventApi({ id: formData.id, data: jsonPayload }).unwrap();
        }
        setStatusMessage({ type: "success", title: "Berhasil Diperbarui", desc: "Data kegiatan berhasil diubah." });
      }
      setIsFormModalOpen(false);
      setShowStatusModal(true);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "failed", title: "Gagal Menyimpan", desc: "Terjadi kesalahan saat menyimpan data." });
      setShowStatusModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEventApi(deleteTarget.numericId).unwrap();
      setDeleteTarget(null);
      setStatusMessage({ type: "success", title: "Berhasil Dihapus", desc: "Kegiatan telah dihapus." });
      setShowStatusModal(true);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "failed", title: "Gagal Menghapus", desc: "Terjadi kesalahan sistem." });
      setShowStatusModal(true);
    }
  };

  // Filter
  const filteredEvents = eventsState.filter(e => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = e.title.toLowerCase().includes(searchLower) || e.category.toLowerCase().includes(searchLower);
    return matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const paginationRange = generatePagination(activePage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-20">
      <SiteHeader title="Manajemen Kegiatan" subtitle="Pengaturan kegiatan ILMS" />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#232b39]">Manajemen Kegiatan</h1>
            <p className="text-slate-500 mt-1">Kelola data acara, workshop, dan aktivitas komunitas.</p>
          </div>
          <Link href="/admin/kegiatan/tambah">
            <Button className="bg-[#99BD4A] hover:bg-[#85a63e] text-white rounded-lg shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kegiatan
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Cari nama kegiatan..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-[#99BD4A]/30 rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="w-[80px] font-semibold text-slate-600">Cover</TableHead>
                    <TableHead className="font-semibold text-slate-600">Kegiatan</TableHead>
                    <TableHead className="font-semibold text-slate-600">Waktu & Tempat</TableHead>
                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">Memuat data kegiatan...</TableCell>
                    </TableRow>
                  ) : currentEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                        Tidak ada kegiatan yang ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentEvents.map((item) => (
                      <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/80 group transition-colors">
                        <TableCell>
                          <div className="w-16 h-12 relative rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {item.cover_url ? (
                              <Image src={item.cover_url} alt="cover" fill className="object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-[#99BD4A] transition-colors line-clamp-1">{item.title}</span>
                            <span className="text-xs text-slate-500 mt-0.5">{item.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center text-xs text-slate-600">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {item.eventTimeDisplay}
                            </div>
                            <div className="flex items-center text-xs text-slate-600">
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {item.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                            item.status === 'Akan Datang' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/admin/kegiatan/${item.numericId}/komentar`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg">
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Komentar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Kegiatan</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Hapus</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-sm text-slate-500 font-medium">
                  Menampilkan <span className="text-slate-900">{startIndex + 1}</span> - <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredEvents.length)}</span> dari <span className="text-slate-900">{filteredEvents.length}</span> kegiatan
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={activePage === 1} className="h-8 w-8 rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {paginationRange.map((pageNum, idx) => (
                    pageNum === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                    ) : (
                      <Button key={pageNum} variant={activePage === pageNum ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(pageNum as number)} className={`h-8 w-8 rounded-lg ${activePage === pageNum ? "bg-[#99BD4A] hover:bg-[#85a63e] text-white border-0 shadow-sm" : ""}`}>
                        {pageNum}
                      </Button>
                    )
                  ))}
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={activePage === totalPages} className="h-8 w-8 rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Form Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kegiatan</DialogTitle>
            <DialogDescription>Lengkapi formulir di bawah untuk menyimpan data kegiatan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Judul Kegiatan</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Workshop Menulis" />
              </div>
              <div className="space-y-2">
                <Label>Kategori / Jenis</Label>
                <Input required value={formData.event_type} onChange={e => setFormData({...formData, event_type: e.target.value})} placeholder="Contoh: Literasi, Seni" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Waktu Kegiatan (Sistem)</Label>
                <Input type="datetime-local" required value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Waktu Tampil (Display)</Label>
                <Input required value={formData.event_time_display} onChange={e => setFormData({...formData, event_time_display: e.target.value})} placeholder="Minggu, 15 Juni 2026 09:00 - Selesai" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Contoh: Aula Wadas Kelir" />
            </div>

            <div className="space-y-2">
              <Label>Ringkasan (Summary)</Label>
              <Input required value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} placeholder="Deskripsi singkat kegiatan" />
            </div>

            <div className="space-y-2">
              <Label>Konten Lengkap</Label>
              <Textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Tuliskan deskripsi lengkap kegiatan..." className="min-h-[120px]" />
            </div>

            <div className="space-y-2">
              <Label>Gambar Cover</Label>
              <div className="flex items-center gap-4">
                {coverPreview && (
                  <div className="w-24 h-24 relative rounded overflow-hidden border">
                    <Image src={coverPreview.startsWith('http') || coverPreview.startsWith('blob') ? coverPreview : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${coverPreview}`} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="cursor-pointer" />
                  <p className="text-xs text-slate-500 mt-1">Upload gambar cover baru (opsional saat edit).</p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isUpdating} className="bg-[#99BD4A] hover:bg-[#85a63e] text-white">
                {isUpdating ? "Menyimpan..." : "Simpan Kegiatan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Hapus Kegiatan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">Apakah Anda yakin ingin menghapus kegiatan <span className="font-bold text-slate-900">&quot;{deleteTarget?.title}&quot;</span>? Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StatusModal
        isOpen={showStatusModal}
        onOpenChange={setShowStatusModal}
        status={statusMessage.type}
        title={statusMessage.title}
        description={statusMessage.desc}
        actionLabel="Tutup"
        onAction={() => setShowStatusModal(false)}
      />
    </div>
  );
}
