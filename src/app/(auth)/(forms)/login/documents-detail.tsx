"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Download,
  Headset,
  MessageSquare,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { RegisterFormData } from "./register-view";

interface DetailBerkasViewProps {
  formData: RegisterFormData;
  regId: string;
  isAdult: boolean;
  docPreview: string | null;
  onBack: () => void;
  onContactAdmin: () => void;
}

export default function DetailBerkasView({
  formData,
  regId,
  isAdult,
  docPreview,
  onBack,
  onContactAdmin,
}: DetailBerkasViewProps) {
  const todayDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleDownloadFile = () => {
    if (formData.identity_doc) {
      const url = URL.createObjectURL(formData.identity_doc);
      const a = document.createElement("a");
      a.href = url;
      a.download = formData.identity_doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("File dokumen belum diunggah atau tidak tersedia di sesi ini.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fafbf9] font-sans text-slate-900 overflow-y-auto p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#99BD4A] font-semibold text-[14px] hover:text-[#85a440] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Status
          </button>
          <h1 className="text-[26px] font-extrabold text-[#1a202c]">
            Detail Berkas Pendaftaran
          </h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Tinjau kembali informasi pendaftaran yang telah Anda kirimkan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Info Registrasi */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative">
              <div className="absolute top-6 right-6 bg-[#f4f7ef] text-[#99BD4A] text-[11px] font-bold px-3 py-1.5 rounded-full tracking-wider">
                TERVERIFIKASI
              </div>
              <h3 className="text-[18px] font-bold text-[#1a202c] mb-6">
                Informasi Registrasi
              </h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    NAMA LENGKAP
                  </p>
                  <p className="font-semibold text-[#1a202c] text-[15px]">
                    {formData.name || "Nama Pengguna"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    EMAIL
                  </p>
                  <p className="font-semibold text-[#1a202c] text-[15px]">
                    {formData.email || "email@contoh.com"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    TANGGAL LAHIR
                  </p>
                  <p className="font-semibold text-[#1a202c] text-[15px]">
                    {formData.birth_date || "14 Agustus 2005"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    NOMOR WHATSAPP
                  </p>
                  <p className="font-semibold text-[#1a202c] text-[15px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#99BD4A]" />{" "}
                    {formData.phone || "+62 812 3456 7890"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dokumen Terlampir */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[18px] font-bold text-[#1a202c] mb-6">
                Dokumen Terlampir
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden group">
                  <div className="h-32 bg-slate-100 relative w-full overflow-hidden flex items-center justify-center">
                    {docPreview ? (
                      <Image
                        src={docPreview}
                        alt="Doc Preview"
                        fill
                        unoptimized
                        className="object-cover filter grayscale opacity-80"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <div className="p-4 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f4f7ef] flex items-center justify-center text-[#99BD4A]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1a202c] text-[13px] truncate w-32">
                          {formData.identity_doc?.name ||
                            (isAdult ? "KTP_Anda.pdf" : "KK_Anda.pdf")}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formData.identity_doc
                            ? `${(formData.identity_doc.size / 1024 / 1024).toFixed(1)} MB`
                            : "2.4 MB"}{" "}
                          • Diunggah
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      className="text-slate-400 hover:text-[#99BD4A] transition-colors"
                      title="Unduh Dokumen"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-[#99BD4A] rounded-2xl p-7 text-white shadow-lg shadow-[#99BD4A]/30">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <Headset className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[18px] font-bold mb-2">
                Ada kesalahan data?
              </h3>
              <p className="text-white/80 text-[13px] leading-relaxed mb-6">
                Jangan khawatir, tim admin kami siap membantu Anda melakukan
                perbaikan data pendaftaran.
              </p>
              <Button
                onClick={onContactAdmin}
                className="w-full bg-white hover:bg-slate-50 text-[#99BD4A] font-bold rounded-xl py-6 flex items-center justify-center gap-2 border-none"
              >
                <MessageSquare className="w-4 h-4" /> Hubungi Admin
              </Button>
              <p className="text-[10px] text-center text-white/60 uppercase tracking-wider mt-4 font-semibold">
                Respon Cepat Via WhatsApp
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                Informasi Tambahan
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Tanggal Daftar</p>
                  <p className="font-bold text-[#1a202c] text-[13px]">
                    {todayDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Nomor Registrasi</p>
                  <p className="font-bold text-[#1a202c] text-[13px]">
                    {regId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
