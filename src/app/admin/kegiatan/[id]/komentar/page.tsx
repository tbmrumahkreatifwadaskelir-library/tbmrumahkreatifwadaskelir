"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEventDetailQuery, useDeleteEventCommentMutation } from "@/services/events.service";
import { StatusModal } from "@/components/ui/status-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";

type ApiEventItem = {
  id: number | string;
  title?: string;
  comments?: Array<{
    id: string | number;
    user?: { name?: string; avatar?: string };
    member?: { name?: string };
    created_at: string;
    comment: string;
  }>;
};

export default function ManajemenKomentarKegiatanPage() {
  const params = useParams();
  const kegiatanId = params.id as string;
  
  const { data: eventDetailRes, isLoading } = useEventDetailQuery(kegiatanId, { skip: !kegiatanId });
  const [deleteCommentApi, { isLoading: isDeleting }] = useDeleteEventCommentMutation();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "success" as "success" | "failed", title: "", desc: "" });

  const eventItem = eventDetailRes?.data as ApiEventItem | undefined;
  const comments = eventItem?.comments || [];

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCommentApi(deleteTarget).unwrap();
      setDeleteTarget(null);
      setStatusMessage({ type: "success", title: "Berhasil Dihapus", desc: "Komentar telah dihapus." });
      setShowStatusModal(true);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "failed", title: "Gagal Menghapus", desc: "Terjadi kesalahan sistem." });
      setShowStatusModal(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-20">
      <SiteHeader title="Komentar Kegiatan" subtitle="Moderasi komentar kegiatan ILMS" />
      <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 md:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin/kegiatan" className="text-slate-400 hover:text-[#99BD4A] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-[#232b39]">
                Komentar Kegiatan
              </h1>
            </div>
            <p className="text-slate-500 ml-7">
              Moderasi diskusi untuk kegiatan <span className="font-bold text-slate-700">{eventItem?.title || "Memuat..."}</span>
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-slate-500">Memuat data komentar...</div>
            ) : comments.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Komentar</h3>
                <p className="text-slate-500 max-w-sm">Komentar dari peserta atau masyarakat yang dikirim di kegiatan ini akan muncul di sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {comments.map((comment) => {
                  const authorName = comment.user?.name || comment.member?.name || "Pengguna Anonim";
                  const date = new Date(comment.created_at).toLocaleDateString("id-ID", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                  });

                  return (
                    <div key={comment.id} className="p-5 md:p-6 flex flex-col sm:flex-row gap-4 hover:bg-slate-50/50 transition-colors group">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#99BD4A] to-[#7a9937] rounded-full shrink-0 flex items-center justify-center text-white font-bold text-lg">
                        {authorName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900">{authorName}</h4>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {date}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed mb-3">
                          {comment.comment}
                        </p>
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-8 px-2"
                            onClick={() => setDeleteTarget(comment.id.toString())}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            <span className="text-xs font-semibold">Hapus Komentar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Hapus Komentar</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <DialogDescription className="text-slate-600">
              Apakah Anda yakin ingin menghapus komentar ini dari kegiatan? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
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
