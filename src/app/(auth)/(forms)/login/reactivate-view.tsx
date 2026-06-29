"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, ArrowRight, ArrowLeft, FileText } from "lucide-react";
import { useReactivateAccountMutation } from "@/services/auth.service";
import { ApiError } from "@/lib/error-utils";
import { StatusModal } from "@/components/ui/status-modal";

interface ReactivateProps {
  onBackToLogin: () => void;
}

export function ReactivateView({ onBackToLogin }: ReactivateProps) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [reactivateAccount, { isLoading }] = useReactivateAccountMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (reason.trim().length < 10) {
      setError("Alasan reaktivasi minimal harus 10 karakter.");
      return;
    }

    try {
      await reactivateAccount({ email: email.trim(), reason: reason.trim() }).unwrap();
      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr?.data?.message || "Gagal mengirimkan pengajuan reaktivasi.");
    }
  };

  return (
    <div className="h-screen w-full flex bg-white font-sans text-slate-900 overflow-x-hidden animate-in fade-in duration-300">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative min-h-screen bg-[#9ABE4B]/20">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center w-full">
          <div className="w-[450px] shadow-md aspect-[4/4] bg-[#faecd5] rounded-xl flex items-center justify-center overflow-hidden relative mb-6">
            <Image
              src="/images/image-forget.png"
              alt="Account Recovery Illustration"
              fill
              className="object-cover scale-[1.15] origin-top"
            />
          </div>
          <h2 className="text-[26px] font-extrabold text-[#9ABE4B] mb-3 tracking-tight">
            Kembalikan Akses Akunmu
          </h2>
          <p className="text-[#5a7d6a] font-medium text-[16px] leading-relaxed max-w-[450px]">
            Tulis alasan pengajuan reaktivasi dengan lengkap agar admin dapat segera memverifikasi dan mengaktifkan kembali akun Anda.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start lg:justify-center p-8 pt-16 lg:p-24 relative min-h-screen">
        <div className="w-full max-w-[420px] flex flex-col items-center mt-8 lg:mt-0">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-[#99BD4A]/20 flex items-center justify-center mb-5">
            <Image
              src="/icons/icon-ilms-no-fill.png"
              alt="Logo"
              width={32}
              height={32}
            />
          </div>

          <p className="text-[#6b8f4a] text-[12px] font-bold tracking-[0.2em] uppercase mb-3">
            Rumah Kreatif Wadas Kelir
          </p>

          <h1 className="text-[30px] font-extrabold text-[#1a202c] mb-3 tracking-tight text-center">
            Reaktivasi Akun
          </h1>
          <p className="text-slate-500 text-[14px] font-medium leading-relaxed text-center mb-8 max-w-[340px]">
            Silakan lengkapi form di bawah ini untuk mengajukan pemulihan akun Anda yang ditangguhkan.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 w-full">
            <div className="space-y-2">
              <Label
                htmlFor="reactivate-email"
                className="font-bold text-[13px] text-slate-700"
              >
                Alamat Email Terdaftar
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-[18px] w-[18px]" />
                </div>
                <Input
                  id="reactivate-email"
                  type="email"
                  placeholder="contoh: nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-[44px] py-[22px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="reactivate-reason"
                className="font-bold text-[13px] text-slate-700"
              >
                Alasan Pengajuan Reaktivasi
              </Label>
              <div className="relative">
                <div className="absolute top-3 left-4 text-slate-400">
                  <FileText className="h-[18px] w-[18px]" />
                </div>
                <Textarea
                  id="reactivate-reason"
                  placeholder="Tulis alasan reaktivasi minimal 10 karakter..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="pl-[44px] pt-3 min-h-[140px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium resize-none"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Tuliskan secara jelas mengapa akun Anda perlu diaktifkan kembali.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full py-[24px] rounded-xl bg-[#9ABE4B] hover:bg-[#89A843] text-white font-bold text-[15px] transition-colors duration-200 shadow-md shadow-[#9ABE4B]/20 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? "Mengirim..." : "Kirim Pengajuan"}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </Button>

            <hr className="mt-14" />

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={onBackToLogin}
                className="font-bold text-slate-600 hover:text-slate-800 text-[14px] flex items-center justify-center w-full gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Halaman Login
              </button>
            </div>
          </form>

          {/* Copyright */}
          <p className="text-[11px] text-slate-400 font-medium mt-12 text-center">
            © 2026 Intelligent Library Management System. Seluruh Hak Cipta Dilindungi.
          </p>
        </div>
      </div>

      <StatusModal
        isOpen={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
        status="success"
        title="Pengajuan Berhasil!"
        description="Permohonan reaktivasi akun Anda telah terkirim. Admin akan segera meninjau permohonan Anda."
        actionLabel="Tutup"
        onAction={() => {
          setIsSuccessModalOpen(false);
          onBackToLogin();
        }}
      />
    </div>
  );
}
