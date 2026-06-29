"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Search, Info, Loader2, User } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";
import { StatusModal } from "@/components/ui/status-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMemberDetailQuery, useVerifyMemberMutation } from "@/services/members.service";
import { getStorageUrl } from "@/lib/utils";

export default function DetailPeninjauanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: memberApiRes, isLoading: isFetching } = useMemberDetailQuery(id);
  const [verifyMember, { isLoading: isVerifying }] = useVerifyMemberMutation();
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationChecks, setValidationChecks] = useState({
    foto: false,
    nik: false,
    dokumen: false,
    masa: false,
  });
  const allChecked = Object.values(validationChecks).every(Boolean);

  const handleApprove = async () => {
    try {
      await verifyMember({ id, action: "approve" }).unwrap();
      router.push("/admin/anggota/peninjauan");
    } catch (err) {
      console.error("Gagal menyetujui anggota:", err);
      setErrorMsg("Gagal menyetujui anggota.");
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      setErrorMsg("Harap masukkan alasan penolakan!");
      return;
    }
    try {
      await verifyMember({ id, action: "reject", reason: rejectReason }).unwrap();
      setIsRejectModalOpen(false);
      router.push("/admin/anggota/peninjauan");
    } catch (err) {
      console.error("Gagal menolak anggota:", err);
      setErrorMsg("Gagal menolak anggota.");
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-[#99BD4A]" />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = memberApiRes?.data as any;

  if (!m) {
    notFound();
  }

  const user = m.user || {};
  const statusStr = m.verification_status === 'verified' 
      ? 'TERVERIFIKASI' 
      : m.verification_status === 'rejected' 
      ? 'DITOLAK' 
      : 'MENUNGGU VERIFIKASI';
      
  const member = {
    id: m.id,
    name: user.name || m.name || "Tanpa Nama",
    email: user.email || m.email || "-",
    nik: m.nik_nisn || "-",
    date: m.created_at ? new Date(m.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-",
    status: statusStr,
    identity_doc_url: m.identity_doc_url || (m.identity_doc_path ? getStorageUrl(m.identity_doc_path) : null)
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader 
        title="Manajemen Anggota" 
        subtitle="Peninjauan calon anggota baru" 
      />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Link href="/admin/dashboard" className="hover:text-slate-900 transition-colors">DASHBOARD</Link>
            <span>›</span>
            <Link href="/admin/anggota/peninjauan" className="hover:text-slate-900 transition-colors">PENINJAUAN</Link>
            <span>›</span>
            <span className="text-slate-900 uppercase">{member.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Detail Peninjauan</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-slate-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                <User className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{member.name}</h2>
                <div className="text-xs font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded-md w-fit mt-1">
                  ID: REG-{id.padStart(3, "0")}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Nomor Induk Kependudukan</h3>
                <p className="text-lg text-slate-900 font-medium">{member.nik}</p>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Email Address</h3>
                <p className="text-lg text-slate-900 font-medium">{member.email}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Waktu Pendaftaran</h3>
                <p className="text-lg text-slate-900 font-medium">{member.date} WIB</p>
              </div>
            </div>

            <Card className="border-l-4 border-l-[#99BD4A] shadow-sm bg-slate-50">
              <CardContent className="p-6">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">Catatan Sistem</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#99BD4A] shrink-0"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Pendaftaran Diterima</p>
                      <p className="text-xs text-slate-500 mt-0.5">{member.date} WIB</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#99BD4A] shrink-0"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Sistem OCR Berhasil</p>
                      <p className="text-xs text-slate-500 mt-0.5">{member.date} WIB</p>
                    </div>
                  </li>
                  {member.status === "DITOLAK" && (
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 text-yellow-600">Perlu Tinjau Ulang</p>
                        <p className="text-xs text-slate-500 mt-0.5">Admin • Menunggu Tinjau Ulang</p>
                      </div>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* KTP Preview */}
            <Card className="shadow-sm border-slate-100 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-slate-50 py-4">
                <CardTitle className="text-sm font-bold tracking-wider uppercase text-slate-700">Pratinjau KTP</CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsFullScreenOpen(true)}
                  className="text-xs font-bold text-[#99BD4A] hover:text-[#88ab3d] hover:bg-[#99BD4A]/10 h-8 px-2"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Lihat Layar Penuh
                </Button>
              </CardHeader>
              <CardContent className="p-6 bg-slate-50/50 flex justify-center items-center min-h-[300px] relative">
                {member.identity_doc_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.identity_doc_url} alt="KTP" className="max-w-md max-h-56 object-cover rounded-lg shadow-inner border border-slate-300" />
                ) : (
                  <div className="w-full max-w-md h-56 bg-slate-200 rounded-lg flex items-center justify-center relative shadow-inner overflow-hidden border border-slate-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-2 border-dashed border-[#99BD4A]/50 bg-[#99BD4A]/5 rounded flex items-center justify-center">
                         <span className="text-[#99BD4A] font-bold text-sm tracking-widest uppercase">Document Missing</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Checklist */}
            <Card className="shadow-sm border-slate-100">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-slate-700 tracking-wider uppercase mb-6">Daftar Periksa Validasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="foto"
                      checked={validationChecks.foto}
                      onCheckedChange={(v) => setValidationChecks(prev => ({ ...prev, foto: !!v }))}
                      className="w-5 h-5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#99BD4A] data-[state=checked]:border-[#99BD4A]"
                    />
                    <label htmlFor="foto" className="text-sm font-bold text-slate-700 cursor-pointer">Foto sesuai</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="nik"
                      checked={validationChecks.nik}
                      onCheckedChange={(v) => setValidationChecks(prev => ({ ...prev, nik: !!v }))}
                      className="w-5 h-5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#99BD4A] data-[state=checked]:border-[#99BD4A]"
                    />
                    <label htmlFor="nik" className="text-sm font-bold text-slate-700 cursor-pointer">NIK valid</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="dokumen"
                      checked={validationChecks.dokumen}
                      onCheckedChange={(v) => setValidationChecks(prev => ({ ...prev, dokumen: !!v }))}
                      className="w-5 h-5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#99BD4A] data-[state=checked]:border-[#99BD4A]"
                    />
                    <label htmlFor="dokumen" className="text-sm font-bold text-slate-700 cursor-pointer">Dokumen terbaca</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="masa"
                      checked={validationChecks.masa}
                      onCheckedChange={(v) => setValidationChecks(prev => ({ ...prev, masa: !!v }))}
                      className="w-5 h-5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#99BD4A] data-[state=checked]:border-[#99BD4A]"
                    />
                    <label htmlFor="masa" className="text-sm font-bold text-slate-700 cursor-pointer">Masa berlaku aktif</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button 
                  onClick={handleApprove}
                  disabled={isVerifying || member.status === "TERVERIFIKASI" || !allChecked}
                  title={!allChecked ? "Centang semua item validasi terlebih dahulu" : undefined}
                  className="flex-1 bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold tracking-wider uppercase h-14 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                  {member.status === "TERVERIFIKASI" ? "Sudah Terverifikasi" : "Setujui Pendaftaran"}
                </Button>
                <Button 
                  onClick={() => setIsRejectModalOpen(true)}
                  variant="outline" 
                  disabled={isVerifying || member.status === "TERVERIFIKASI"}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold tracking-wider uppercase h-14 text-sm rounded-lg disabled:opacity-50"
                >
                  <X className="w-5 h-5 mr-2" />
                  Tolak dengan Alasan
                </Button>
              </div>
            </div>

            {/* Modal Tolak Pendaftaran */}
            <StatusModal
              isOpen={isRejectModalOpen}
              onOpenChange={setIsRejectModalOpen}
              status="reject"
              title="Tolak Pendaftaran"
              description="Silakan berikan alasan penolakan. Alasan ini akan dikirimkan kepada calon anggota melalui notifikasi."
              actionLabel="Kirim Penolakan"
              cancelLabel="Batal"
              onAction={handleReject}
              isLoading={isVerifying}
            >
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  Alasan Penolakan
                </label>
                <Textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan di sini..." 
                  className="min-h-[120px] bg-[#f8fafc] border-slate-100 resize-none text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300"
                />
                <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                  <Info className="w-3.5 h-3.5" />
                  <span className="text-xs">Informasi ini akan ditampilkan di portal aplikasi user.</span>
                </div>
              </div>
            </StatusModal>

            {/* Modal Layar Penuh KTP */}
            <Dialog open={isFullScreenOpen} onOpenChange={setIsFullScreenOpen}>
              <DialogContent className="max-w-4xl w-[95vw] p-2 bg-slate-900 border-none shadow-2xl flex justify-center items-center [&>button]:text-white">
                <div className="relative w-full aspect-[1.58] bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {member.identity_doc_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.identity_doc_url} alt="KTP Full Screen" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-[85%] h-[85%] border-[3px] border-dashed border-[#99BD4A] bg-[#99BD4A]/10 rounded-2xl flex items-center justify-center">
                         <span className="text-[#99BD4A] font-extrabold text-2xl tracking-widest uppercase shadow-sm">Document Missing</span>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
        </div>
      </main>
    </div>
  );
}
