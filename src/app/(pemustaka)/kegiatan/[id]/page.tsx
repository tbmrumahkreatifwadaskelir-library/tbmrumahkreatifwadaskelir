"use client";

import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Share2,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { StatusModal } from "@/components/ui/status-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  useEventDetailQuery, 
  useAddEventCommentMutation, 
  useListEventsQuery,
  useEditEventCommentMutation,
  useDeleteEventCommentMutation
} from "@/services/events.service";

type ApiEventItem = {
  id: number | string;
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
  comments?: Array<{
    id: string | number;
    user?: { name?: string; avatar?: string; id?: string | number };
    member?: { name?: string; id?: string | number };
    created_at: string;
    comment: string;
  }>;
};

type MappedDetail = {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  timeInfo: string;
  locationInfo: string;
  content: string;
  image: string;
};

export default function DetailKegiatanPage() {
  const params = useParams();
  const kegiatanId = params.id as string;
  const { data: eventDetailRes, isLoading } = useEventDetailQuery(kegiatanId, { skip: !kegiatanId });
  const { data: allEventsRes } = useListEventsQuery();

  const [kegiatan, setKegiatan] = useState<MappedDetail | null>(null);

  useEffect(() => {
    if (eventDetailRes?.data) {
      const item = eventDetailRes.data as ApiEventItem;
        const rawImg = item.cover_url || item.image || item.cover_path || item.cover;
        const finalImg = rawImg 
          ? (rawImg.startsWith('http') ? rawImg : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) 
          : `/images/kegiatan-1.jpg`;

        setKegiatan({
          id: item.id.toString(),
          title: item.title || "Tanpa Judul",
          category: item.event_type || "Seni & Budaya",
          publishDate: item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "Baru saja",
          timeInfo: item.event_time_display || item.event_time || "-",
          locationInfo: item.location || "Aula Wadas Kelir",
          content: typeof window !== "undefined" ? DOMPurify.sanitize(item.content || "") : (item.content || ""),
          image: finalImg
        });

        if (item.comments && Array.isArray(item.comments)) {
          const mappedComments = item.comments.map((c) => ({
            id: c.id.toString(),
            name: c.user?.name || c.member?.name || "Pengguna",
            time: new Date(c.created_at).toLocaleDateString("id-ID"),
            text: c.comment,
            avatar: c.user?.avatar || "",
            userId: c.user?.id?.toString() || c.member?.id?.toString() || null,
          }));
          setComments(mappedComments);
        }
      }
  }, [eventDetailRes, kegiatanId]);

  const [commentInput, setCommentInput] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, status: "success" as "success" | "failed", title: "", desc: "" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const [comments, setComments] = useState<{id: string; name: string; time: string; text: string; avatar: string; userId?: string | null}[]>([]);
  const [addCommentApi, { isLoading: isSubmitting }] = useAddEventCommentMutation();
  const [editCommentApi, { isLoading: isEditing }] = useEditEventCommentMutation();
  const [deleteCommentApi, { isLoading: isDeleting }] = useDeleteEventCommentMutation();
  const { data: session } = useSession();

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentInput, setEditCommentInput] = useState("");

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) return;

    try {
      await addCommentApi({ id: kegiatanId, data: { comment: commentInput } }).unwrap();
      
      const newComment = {
        id: Date.now().toString(),
        name: session?.user?.name || "Pengguna Anonim",
        time: "Baru saja",
        text: commentInput,
        avatar: session?.user?.image || "", // Fallback will show initial
      };

      setComments([newComment, ...comments]);
      setCommentInput("");
      setIsSuccessModalOpen(true);
    } catch (error: unknown) {
      console.error("Gagal menambahkan komentar", error);
      const err = error as { data?: { message?: string }; message?: string };
      const msg = err?.data?.message || err?.message || "Gagal menambahkan komentar. Pastikan Anda sudah login.";
      setStatusModal({ isOpen: true, status: "failed", title: "Gagal Menambahkan Komentar", desc: msg });
    }
  };

  const handleEditClick = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditCommentInput(currentText);
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditCommentInput("");
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editCommentInput.trim()) return;
    try {
      await editCommentApi({ id: commentId, data: { comment: editCommentInput } }).unwrap();
      setEditingCommentId(null);
      setEditCommentInput("");
      setStatusModal({ isOpen: true, status: "success", title: "Komentar Diperbarui", desc: "Komentar Anda telah berhasil diperbarui." });
    } catch (error: unknown) {
      console.error("Gagal mengedit komentar", error);
      setStatusModal({ isOpen: true, status: "failed", title: "Gagal Mengedit", desc: "Gagal mengedit komentar. Silakan coba lagi." });
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteConfirmOpen(true);
  };

  const executeDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteCommentApi(commentToDelete).unwrap();
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
      setStatusModal({ isOpen: true, status: "success", title: "Komentar Dihapus", desc: "Komentar telah berhasil dihapus." });
    } catch (error: unknown) {
      console.error("Gagal menghapus komentar", error);
      setDeleteConfirmOpen(false);
      setStatusModal({ isOpen: true, status: "failed", title: "Gagal Menghapus", desc: "Gagal menghapus komentar. Silakan coba lagi." });
    }
  };

  // Process allEventsRes for related and recent posts
  const rawAll = allEventsRes as { data?: ApiEventItem[] | { data?: ApiEventItem[] } } | undefined;
  const allEvents: ApiEventItem[] = Array.isArray(rawAll?.data) ? rawAll.data : 
                    (rawAll?.data && 'data' in rawAll.data && Array.isArray(rawAll.data.data)) ? rawAll.data.data : [];

  const recentPosts = allEvents
    .filter((item: ApiEventItem) => item.id.toString() !== kegiatanId)
    .slice(0, 3)
    .map((item: ApiEventItem) => {
      const rImg = item.cover_url || item.image || item.cover_path || item.cover;
      return {
        id: item.id.toString(),
        title: item.title || "Tanpa Judul",
        date: item.event_time_display || (item.event_time ? new Date(item.event_time).toLocaleDateString("id-ID") : ""),
        image: rImg ? (rImg.startsWith('http') ? rImg : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${rImg}`) : `/images/kegiatan-1.jpg`
      };
    });

  const relatedKegiatan = allEvents
    .filter((item: ApiEventItem) => item.event_type === kegiatan?.category && item.id.toString() !== kegiatanId)
    .slice(0, 3)
    .map((item: ApiEventItem) => {
      const rImg = item.cover_url || item.image || item.cover_path || item.cover;
      return {
        id: item.id.toString(),
        title: item.title || "Tanpa Judul",
        category: item.event_type || "Lainnya",
        image: rImg ? (rImg.startsWith('http') ? rImg : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${rImg}`) : `/images/kegiatan-1.jpg`
      };
    });

  if (isLoading || !kegiatan) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-[#F8F9FA] items-center justify-center">
        <p className="text-slate-500 font-medium">Memuat data kegiatan...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FA] pb-24">
      <div className="max-w-[1100px] mx-auto w-full px-6 pt-8">
        {/* Hero Image */}
        <div className="relative w-full aspect-[21/9] md:aspect-[24/10] bg-slate-900 rounded-2xl overflow-hidden mb-8 shadow-sm">
          {/* Fallback pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-[#1e293b] flex items-center justify-center">
            <div className="w-40 h-40 border-[16px] border-slate-700/50 rounded-full"></div>
            <div className="absolute w-24 h-24 border-[12px] border-slate-600/30 rounded-sm rotate-45"></div>
          </div>
          <Image
            src={kegiatan.image}
            alt={kegiatan.title}
            fill
            className="object-cover relative z-10"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          {/* Back Button Overlay */}
          <div className="absolute top-6 left-6 z-20">
            <Link
              href="/kegiatan"
              className="inline-flex items-center gap-2 bg-[#b4d262] hover:bg-[#9fc53a] text-white px-5 py-2.5 rounded-xl font-bold text-[14px] transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
        </div>

        {/* Title & Metadata Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-[#b4d262] text-white text-[11px] font-extrabold px-3 py-1.5 rounded uppercase tracking-wider">
              {kegiatan.category}
            </span>
            <span className="text-slate-500 text-[13px] font-medium">
              Dipublikasikan {kegiatan.publishDate}
            </span>
          </div>
          <h1 className="text-[32px] md:text-[44px] font-extrabold text-[#111827] leading-[1.15] mb-8 tracking-tight max-w-[800px]">
            {kegiatan.title}
          </h1>

          {/* Info Boxes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row gap-8 shadow-sm">
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-[#f6f8f1] text-[#99BD4A] p-3 rounded-xl shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[#64748b] text-[12px] font-bold tracking-wider uppercase block mb-1">
                  Waktu & Tanggal
                </span>
                <span className="text-[#1e293b] text-[15px] font-bold">
                  {kegiatan.timeInfo}
                </span>
              </div>
            </div>

            <div className="hidden md:block w-px bg-slate-100"></div>

            <div className="flex items-start gap-4 flex-1">
              <div className="bg-[#f6f8f1] text-[#99BD4A] p-3 rounded-xl shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[#64748b] text-[12px] font-bold tracking-wider uppercase block mb-1">
                  Tempat Kegiatan
                </span>
                <span className="text-[#1e293b] text-[15px] font-bold">
                  {kegiatan.locationInfo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Main Content & Comments */}
          <div className="lg:col-span-2">
            {/* Rich Text Content */}
            <div 
              className="prose prose-slate max-w-none mb-16 text-[#4b5563] text-[16px] md:text-[17px] leading-[1.8] text-justify"
              dangerouslySetInnerHTML={{ __html: kegiatan.content }} 
            />

            <hr className="border-slate-100 mb-12" />

            {/* Komentar Section */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-1 bg-[#99BD4A] rounded-full"></div>
                <h3 className="text-[22px] font-extrabold text-[#111827]">
                  Komentar
                </h3>
              </div>

              {/* Comment Input */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-10">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Berikan pendapat atau pertanyaan Anda..."
                  className="w-full bg-[#F8F9FA] text-slate-900 border-none rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-y mb-4 placeholder:text-slate-400 focus:ring-1 focus:ring-[#99BD4A]/50"
                ></textarea>
                <div className="flex justify-end">
                  <button
                    onClick={handleCommentSubmit}
                    disabled={isSubmitting}
                    className="bg-[#b4d262] hover:bg-[#9fc53a] text-white px-6 py-2.5 rounded-xl font-bold text-[14px] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Mengirim..." : "Kirim Komentar"}
                  </button>
                </div>
              </div>

              {/* Comment List */}
              <div className="flex flex-col gap-5">
                {comments.map((comment) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const userSession = session?.user as any;
                  const isOwner = userSession?.id?.toString() === comment.userId;
                  const isAdmin = userSession?.role === "admin";
                  const isEditingThis = editingCommentId === comment.id;

                  return (
                  <div key={comment.id} className="flex gap-4">
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-xl bg-slate-200 shrink-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#2c4c3b] to-[#426152] flex items-center justify-center text-white font-bold text-lg">
                        {comment.name.charAt(0)}
                      </div>
                      <Image
                        src={comment.avatar}
                        alt={comment.name}
                        fill
                        className="object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    {/* Comment Body */}
                    <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#111827] text-[15px]">
                            {comment.name}
                          </span>
                          <span className="text-[#94a3b8] text-[12px] font-medium">
                            {comment.time}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        {!isEditingThis && (isOwner || isAdmin) && (
                          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                            {isOwner && (
                              <button 
                                onClick={() => handleEditClick(comment.id, comment.text)}
                                className="p-1.5 text-slate-400 hover:text-[#b4d262] rounded-lg hover:bg-slate-50 transition-colors"
                                title="Edit Komentar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteClick(comment.id)}
                              disabled={isDeleting}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              title="Hapus Komentar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="mt-3">
                          <textarea
                            value={editCommentInput}
                            onChange={(e) => setEditCommentInput(e.target.value)}
                            className="w-full bg-[#F8F9FA] text-slate-900 border-none rounded-xl p-3 text-[14px] outline-none min-h-[80px] resize-y mb-3 focus:ring-1 focus:ring-[#99BD4A]/50"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={handleEditCancel}
                              className="px-4 py-1.5 text-[12px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleEditSubmit(comment.id)}
                              disabled={isEditing}
                              className="px-4 py-1.5 text-[12px] font-bold text-white bg-[#b4d262] hover:bg-[#9fc53a] rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                              {isEditing ? "Menyimpan..." : "Simpan"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-[14px] leading-relaxed whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            </div>

            {/* Kegiatan Lainnya Section */}
            <div className="mt-20">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-1 bg-[#99BD4A] rounded-full"></div>
                <h3 className="text-[22px] font-extrabold text-[#111827]">
                  Kegiatan Lainnya
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedKegiatan.length > 0 ? relatedKegiatan.map((item) => (
                  <Link
                    href={`/kegiatan/${item.id}`}
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col group"
                  >
                    <div className="relative w-full aspect-[16/10] bg-slate-800 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2c4c3b] to-[#426152] flex items-center justify-center">
                        {/* Pattern fallback */}
                        <div className="w-20 h-20 rounded-full border-[8px] border-white/10"></div>
                      </div>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover relative z-10 group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-[#b4d262] text-[12px] font-bold tracking-wider uppercase mb-2 block">
                        {item.category}
                      </span>
                      <h4 className="font-extrabold text-[#1e293b] text-[18px] leading-snug group-hover:text-[#99BD4A] transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-1 md:col-span-3 py-10 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 font-medium text-[15px]">Belum ada kegiatan lain yang serupa.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar Widgets */}
          <div className="lg:col-span-1 flex flex-col gap-6 sticky top-24 h-fit">
            {/* Postingan Terbaru */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-5 h-1 bg-[#99BD4A] rounded-full"></div>
                <h4 className="text-[17px] font-extrabold text-[#111827]">
                  Postingan Terbaru
                </h4>
              </div>

              <div className="flex flex-col gap-5">
                {recentPosts.length > 0 ? recentPosts.map((post) => (
                  <Link
                    href="#"
                    key={post.id}
                    className="flex items-center gap-4 group"
                  >
                    <div className="relative w-16 h-16 rounded-xl bg-slate-800 shrink-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-slate-400 font-bold text-xl">
                        {post.id.slice(-1)}
                      </div>
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover relative z-10 group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1e293b] text-[14px] leading-snug mb-1 group-hover:text-[#99BD4A] transition-colors line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-[#94a3b8] text-[12px] font-medium">
                        {post.date}
                      </span>
                    </div>
                  </Link>
                )) : (
                  <div className="py-6 text-center border-t border-slate-50 mt-2">
                    <p className="text-slate-500 font-medium text-[13px]">Belum ada postingan terbaru.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bagikan Kegiatan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <span className="font-extrabold text-[#111827] text-[15px]">
                Bagikan Kegiatan:
              </span>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-xl bg-[#F8F9FA] hover:bg-slate-100 text-[#64748b] flex items-center justify-center transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-xl bg-[#F8F9FA] hover:bg-slate-100 text-[#64748b] flex items-center justify-center transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusModal
        isOpen={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
        status="success"
        title={
          <>
            Komentar Berhasil
            <br />
            Terkirim!
          </>
        }
        description="Terima kasih atas tanggapan Anda! Komentar Anda telah berhasil ditambahkan."
        actionLabel="Tutup"
        onAction={() => setIsSuccessModalOpen(false)}
      />

      <StatusModal
        isOpen={statusModal.isOpen}
        onOpenChange={(open) => setStatusModal(prev => ({ ...prev, isOpen: open }))}
        status={statusModal.status}
        title={statusModal.title}
        description={statusModal.desc}
        actionLabel="Tutup"
        onAction={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Hapus Komentar</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>Batal</Button>
            <Button variant="destructive" onClick={executeDeleteComment} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
