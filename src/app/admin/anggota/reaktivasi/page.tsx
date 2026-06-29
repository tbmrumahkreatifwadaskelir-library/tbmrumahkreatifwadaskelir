"use client";

import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { generatePagination } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusModal } from "@/components/ui/status-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { usePendingReactivationsQuery, useVerifyReactivationMutation } from "@/services/members.service";

export default function ReaktivasiAnggotaPage() {
  const { data: reactivationsApiRes, isLoading } = usePendingReactivationsQuery();
  const [verifyReactivation, { isLoading: isVerifying }] = useVerifyReactivationMutation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [approveTarget, setApproveTarget] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await verifyReactivation({ id: approveTarget, action: "approve" }).unwrap();
      setApproveTarget(null);
      setSuccessMsg("Berhasil menyetujui reaktivasi akun.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyetujui reaktivasi akun.");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await verifyReactivation({ id: rejectTarget, action: "reject", reason: rejectReason }).unwrap();
      setRejectTarget(null);
      setRejectReason("");
      setSuccessMsg("Berhasil menolak reaktivasi akun.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menolak reaktivasi akun.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = reactivationsApiRes?.data as any;
  const items = Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
  
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentData = items.slice(startIndex, startIndex + itemsPerPage) as any[];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Manajemen Anggota"
        subtitle="Permintaan Reaktivasi Akun"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Link href="/admin/dashboard" className="hover:text-slate-900 transition-colors">DASHBOARD</Link>
              <span>›</span>
              <Link href="/admin/anggota" className="hover:text-slate-900 transition-colors">ANGGOTA</Link>
              <span>›</span>
              <span className="text-slate-900 uppercase">REAKTIVASI</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Permintaan Reaktivasi Akun
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Tinjau dan setujui permintaan anggota untuk mengaktifkan kembali akun mereka yang ditangguhkan.
            </p>
          </div>
        </div>

        <Card className="shadow-sm border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                  NAMA ANGGOTA
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                  TANGGAL REQUEST
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs tracking-wider w-1/3">
                  ALASAN
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs tracking-wider text-right">
                  AKSI
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    Tidak ada permintaan reaktivasi akun.
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((req) => (
                  <TableRow key={req.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#99BD4A] text-white flex items-center justify-center font-bold text-sm">
                          {(req.user?.name || "A").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {req.user?.name || "-"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {req.user?.email || "-"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {req.reason || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#99BD4A] border-[#99BD4A] hover:bg-[#99BD4A] hover:text-white font-bold h-8 px-4"
                          onClick={() => setApproveTarget(req.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Setujui
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-bold h-8 px-4"
                          onClick={() => setRejectTarget(req.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Tolak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-slate-100">
              <div className="text-sm font-medium text-slate-500 tracking-wider uppercase text-xs">
                MENAMPILKAN {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} DARI {totalItems} PERMINTAAN
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
          )}
        </Card>
      </main>

      {/* Approve Modal */}
      <StatusModal
        isOpen={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        status="success"
        title="Setujui Reaktivasi?"
        description="Akun anggota akan diaktifkan kembali dan mereka akan dapat meminjam buku."
        actionLabel={isVerifying ? "Memproses..." : "Ya, Setujui"}
        cancelLabel="Batal"
        onAction={handleApprove}
        isLoading={isVerifying}
      />

      {/* Reject Modal */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Reaktivasi Akun</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Silakan berikan alasan mengapa Anda menolak permintaan reaktivasi akun ini.
            </p>
            <Textarea
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={isVerifying}>Batal</Button>
            <Button onClick={handleReject} disabled={isVerifying || !rejectReason.trim()} className="bg-red-500 hover:bg-red-600 text-white">Tolak Reaktivasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error/Success Modals */}
      <StatusModal
        isOpen={!!errorMsg}
        onOpenChange={(open) => !open && setErrorMsg("")}
        status="failed"
        title="Terjadi Kesalahan"
        description={errorMsg}
        actionLabel="Tutup"
      />
      <StatusModal
        isOpen={!!successMsg}
        onOpenChange={(open) => !open && setSuccessMsg("")}
        status="success"
        title="Berhasil!"
        description={successMsg}
        actionLabel="Tutup"
      />
    </div>
  );
}
