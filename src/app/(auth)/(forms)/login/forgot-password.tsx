"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, ArrowLeft, KeyRound, Lock } from "lucide-react";
import {
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useConfirmResetPasswordMutation,
} from "@/services/auth.service";
import { ApiError } from "@/lib/error-utils";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordView({ onBackToLogin }: ForgotPasswordProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [signature, setSignature] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [forgotPassword, { isLoading: isRequestingOtp }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [confirmReset, { isLoading: isConfirmingReset }] = useConfirmResetPasswordMutation();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      await forgotPassword({ email }).unwrap();
      setSuccessMsg("OTP telah dikirim ke email Anda.");
      setStep(2);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr?.data?.message || "Gagal meminta reset password.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const res = await verifyOtp({ email, otp }).unwrap();
      setSignature(res.data.signature);
      setSuccessMsg("OTP valid. Silakan masukkan password baru Anda.");
      setStep(3);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr?.data?.message || "OTP tidak valid.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    try {
      await confirmReset({
        email,
        signature,
        password,
        password_confirmation: passwordConfirmation,
      }).unwrap();
      setSuccessMsg("Password berhasil diubah. Silakan login kembali.");
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr?.data?.message || "Gagal mengubah password.");
    }
  };

  return (
    <div className="h-screen w-full flex bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative min-h-screen bg-[#9ABE4B]/20">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center w-full">
          <div className="w-[450px] shadow-md aspect-[4/4] bg-[#faecd5] rounded-xl flex items-center justify-center overflow-hidden relative mb-6">
            <Image
              src="/images/image-forget.png"
              alt="Stacked Books"
              fill
              className="object-cover scale-[1.15] origin-top"
            />
          </div>
          <h2 className="text-[26px] font-extrabold text-[#9ABE4B] mb-3 tracking-tight">
            Kembangkan Duniamu
          </h2>
          <p className="text-[#5a7d6a] font-medium text-[16px] leading-relaxed max-w-[450px]">
            Akses ribuan buku dan sumber daya pengetahuan dalam satu genggaman
            bersama Rumah Kreatif Wadas Kelir.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-24 relative min-h-screen">
        <div className="w-full max-w-[420px] flex flex-col items-center">
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
            Lupa Kata Sandi?
          </h1>
          <p className="text-slate-500 text-[14px] font-medium leading-relaxed text-center mb-8 max-w-[340px]">
            Jangan khawatir, masukkan alamat email Anda untuk menerima tautan
            pemulihan akun.
          </p>

          <form
            onSubmit={
              step === 1
                ? handleRequestOtp
                : step === 2
                ? handleVerifyOtp
                : handleResetPassword
            }
            className="space-y-5 w-full"
          >
            {step === 1 && (
              <div className="space-y-2">
                <Label
                  htmlFor="forgot-email"
                  className="font-bold text-[13px] text-slate-700"
                >
                  Alamat Email Terdaftar
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-[18px] w-[18px]" />
                  </div>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="contoh: nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-[44px] py-[22px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium"
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label
                  htmlFor="otp"
                  className="font-bold text-[13px] text-slate-700"
                >
                  Kode OTP
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-[18px] w-[18px]" />
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Masukkan 4 digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-[44px] py-[22px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium tracking-widest"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="new-password"
                    className="font-bold text-[13px] text-slate-700"
                  >
                    Password Baru
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-[18px] w-[18px]" />
                    </div>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Password baru"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-[44px] py-[22px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="font-bold text-[13px] text-slate-700"
                  >
                    Konfirmasi Password Baru
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-[18px] w-[18px]" />
                    </div>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Konfirmasi password baru"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="pl-[44px] py-[22px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            {successMsg && (
              <p className="text-sm text-green-500 font-medium">{successMsg}</p>
            )}

            <Button
              type="submit"
              className="w-full py-[24px] rounded-xl bg-[#9ABE4B] hover:bg-[#89A843] text-white font-bold text-[15px] transition-colors duration-200 shadow-md shadow-[#9ABE4B]/20 flex items-center justify-center gap-2"
              disabled={isRequestingOtp || isVerifyingOtp || isConfirmingReset}
            >
              {isRequestingOtp || isVerifyingOtp || isConfirmingReset
                ? "Memproses..."
                : step === 1
                ? "Kirim Instruksi"
                : step === 2
                ? "Verifikasi OTP"
                : "Reset Password"}
              {!(isRequestingOtp || isVerifyingOtp || isConfirmingReset) && step !== 3 && (
                <ArrowRight className="w-5 h-5" />
              )}
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
            © 2026 Intelligent Library Management System. Seluruh Hak Cipta
            Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
