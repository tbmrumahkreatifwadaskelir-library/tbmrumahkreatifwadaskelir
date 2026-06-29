"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  CircleDot,
  Lock,
  Hourglass,
  Mail,
  MessageSquareText,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  FileText,
  AlertCircle,
  LogIn,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────── */
type VerificationStatus = "pending" | "verified" | "rejected" | "unknown";

interface MemberInfo {
  name: string;
  email: string;
  phone: string;
  member_id: string;
  registration_date: string;
  verification_status: VerificationStatus;
  rejection_reason?: string;
}

/* ─────────────────────────────────────────────────────────────────
   Stepper — tampilkan step 3 selesai
───────────────────────────────────────────────────────────────── */
function StepIndicator() {
  const steps = ["Informasi Dasar", "Verifikasi Identitas", "Status Pendaftaran"];
  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < 3;
        const active = stepNum === 3;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done
                    ? "bg-[#99BD4A] border-[#99BD4A] text-white"
                    : active
                      ? "bg-[#99BD4A] border-[#99BD4A] text-white"
                      : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
              </div>
              <span
                className={`text-[12px] mt-2 font-semibold whitespace-nowrap ${
                  active ? "text-[#1a202c]" : done ? "text-[#99BD4A]" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`w-20 lg:w-32 h-[2px] mx-2 mb-5 ${
                  stepNum < 3 ? "bg-[#99BD4A]" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Badge status verifikasi
───────────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: VerificationStatus }) {
  const map = {
    pending: { label: "Dalam Proses Verifikasi", color: "bg-amber-50 text-amber-600 border-amber-200" },
    verified: { label: "Terverifikasi", color: "bg-[#f4f7ef] text-[#99BD4A] border-[#d4e6a0]" },
    rejected: { label: "Ditolak", color: "bg-red-50 text-red-500 border-red-200" },
    unknown: { label: "Status Tidak Diketahui", color: "bg-slate-50 text-slate-500 border-slate-200" },
  };
  const { label, color } = map[status];
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold border tracking-wider ${color}`}>
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Content
───────────────────────────────────────────────────────────────── */
export default function RegistrationStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Baca param dari URL (dikirim backend via WA) ──
  const memberId   = searchParams?.get("member_id") ?? "";
  const tokenParam = searchParams?.get("token")     ?? "";
  const nameParam  = searchParams?.get("name")      ?? "";
  const emailParam = searchParams?.get("email")     ?? "";

  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [fetchError, setFetchError] = useState("");

  /* ── Fetch status dari API menggunakan token / member_id ── */
  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (tokenParam) headers["Authorization"] = `Bearer ${tokenParam}`;

        const endpoint = memberId
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/members/${memberId}/status`
          : null;

        if (endpoint) {
          const res = await fetch(endpoint, { headers });
          if (res.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const json: any = await res.json();
            const data = json?.data ?? json;
            setMemberInfo({
              name:                data?.name              ?? nameParam  ?? "Anggota",
              email:               data?.email             ?? emailParam ?? "-",
              phone:               data?.phone             ?? data?.user?.phone ?? "-",
              member_id:           data?.id?.toString()    ?? memberId,
              registration_date:   data?.created_at        ?? new Date().toISOString(),
              verification_status: data?.verification_status ?? data?.status ?? "pending",
              rejection_reason:    data?.rejection_reason  ?? undefined,
            });
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // fallback ke data dari URL params
      }

      // ── Fallback: tampilkan data dari URL params ──
      if (nameParam || emailParam || memberId) {
        setMemberInfo({
          name:                nameParam  || "Anggota",
          email:               emailParam || "-",
          phone:               searchParams?.get("phone") ?? "-",
          member_id:           memberId   || `REG-${Date.now().toString().slice(-8)}`,
          registration_date:   searchParams?.get("registered_at") ?? new Date().toISOString(),
          verification_status: (searchParams?.get("status") as VerificationStatus) ?? "pending",
          rejection_reason:    searchParams?.get("reason") ?? undefined,
        });
      } else {
        setFetchError("Link tidak valid atau sudah kedaluwarsa. Silakan hubungi admin.");
      }
      setIsLoading(false);
    };

    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, tokenParam]);

  const handleContactAdmin = () => {
    const adminWhatsApp = "6281234567890";
    const message = `Halo Admin, saya ingin menanyakan terkait proses pendaftaran saya.\nNama: ${memberInfo?.name}\nID: ${memberInfo?.member_id}`;
    window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Memuat status pendaftaran...</p>
        </div>
      </div>
    );
  }

  /* ── Error / Link tidak valid ── */
  if (fetchError || !memberInfo) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-8 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a202c]">Link Tidak Valid</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            {fetchError || "URL tidak mengandung informasi yang valid. Pastikan Anda membuka link yang dikirim oleh admin perpustakaan."}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full py-6 rounded-xl bg-[#99BD4A] hover:bg-[#85a440] text-white font-bold"
              onClick={handleContactAdmin}
            >
              <MessageSquareText className="w-4 h-4 mr-2" /> Hubungi Admin via WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full py-6 rounded-xl border-slate-200 text-slate-700 font-bold"
              onClick={() => router.push("/login")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status = memberInfo.verification_status;

  /* ── Tampilan utama Step 3 ── */
  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-900 overflow-y-auto">
      {/* Top bar branding */}
      <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#99BD4A]/10 flex items-center justify-center">
          <Image src="/icons/icon-ilms-fill.png" alt="Logo" width={20} height={20} />
        </div>
        <span className="font-extrabold text-[#1a202c] text-[15px] tracking-tight">
          Perpustakaan Digital
        </span>
      </div>

      <StepIndicator />

      <div className="max-w-6xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">

        {/* ── Kiri: Status Card ── */}
        <div className="bg-[#f5f8f0] rounded-[2rem] p-8 lg:p-10 flex flex-col justify-between gap-8">
          <div>
            <StatusBadge status={status} />
            <h2 className="text-[26px] font-extrabold text-[#1a202c] leading-tight mt-4 mb-1">
              {status === "verified"
                ? "Selamat! Akun Anda"
                : status === "rejected"
                  ? "Pendaftaran Ditolak"
                  : "Status Pengajuan:"}
            </h2>
            <h2
              className="text-[26px] font-extrabold leading-tight mb-4"
              style={{ color: status === "rejected" ? "#ef4444" : "#99BD4A" }}
            >
              {status === "verified"
                ? "Telah Aktif!"
                : status === "rejected"
                  ? "Hubungi Admin"
                  : "Dalam Proses Verifikasi Admin"}
            </h2>
            <p className="text-slate-600 text-[14px] font-medium leading-relaxed">
              {status === "verified"
                ? "Verifikasi identitas Anda telah selesai. Kini Anda dapat login dan menikmati seluruh koleksi perpustakaan digital."
                : status === "rejected"
                  ? `Pengajuan pendaftaran Anda tidak dapat kami proses saat ini. ${memberInfo.rejection_reason ? `Alasan: ${memberInfo.rejection_reason}` : "Silakan hubungi admin untuk informasi lebih lanjut."}`
                  : "Terima kasih telah mendaftar. Berkas pendaftaran Anda sedang dalam tahap pemeriksaan oleh tim verifikator kami."}
            </p>
          </div>

          {/* ID Card */}
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-sm">
            <div
              className={`w-28 h-28 mb-5 rounded-full flex items-center justify-center ${
                status === "rejected" ? "bg-red-50" : "bg-[#f8fbf5]"
              }`}
            >
              {status === "verified" ? (
                <CheckCircle2 className="w-12 h-12 text-[#99BD4A]" />
              ) : status === "rejected" ? (
                <AlertCircle className="w-12 h-12 text-red-400" />
              ) : (
                <Hourglass className="w-12 h-12 text-[#99BD4A]" />
              )}
            </div>
            <div className="bg-[#f4f7ef] text-[#99BD4A] text-[11px] font-bold px-3 py-1.5 rounded-full tracking-wider mb-3">
              ID: #{memberInfo.member_id}
            </div>
            <p className="text-[22px] font-extrabold text-[#1a202c]">{memberInfo.name}</p>
            <p className="text-slate-500 text-[13px] font-medium mt-1">{memberInfo.email}</p>
          </div>
        </div>

        {/* ── Kanan ── */}
        <div className="flex flex-col gap-6">

          {/* Notifikasi cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#fcfdfa] border border-slate-100/60 rounded-2xl p-6 shadow-sm">
              <Mail className="w-5 h-5 text-[#99BD4A] mb-4" />
              <p className="font-bold text-[14px] text-[#1a202c] mb-1.5">Email Notifikasi</p>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Update status dikirimkan ke <span className="font-semibold">{memberInfo.email}</span>.
              </p>
            </div>
            <div className="bg-[#fcfdfa] border border-slate-100/60 rounded-2xl p-6 shadow-sm">
              <MessageSquareText className="w-5 h-5 text-[#99BD4A] mb-4" />
              <p className="font-bold text-[14px] text-[#1a202c] mb-1.5">WhatsApp Alert</p>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Pesan instan akan dikirim ke <span className="font-semibold">{memberInfo.phone}</span> setelah akun aktif.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#fcfdfa] border border-slate-100/60 rounded-2xl p-7 shadow-sm flex-1">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-5">
              Tahapan Pendaftaran
            </p>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#99BD4A] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-[14px] font-semibold text-slate-700">Pengiriman Berkas Berhasil</span>
              </div>

              <div className="flex items-center gap-4">
                {status === "verified" ? (
                  <div className="w-6 h-6 rounded-full bg-[#99BD4A] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                ) : status === "rejected" ? (
                  <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <CircleDot className="w-6 h-6 text-[#99BD4A] shrink-0" />
                )}
                <span
                  className={`text-[14px] font-bold ${
                    status === "verified"
                      ? "text-[#99BD4A]"
                      : status === "rejected"
                        ? "text-red-500"
                        : "text-[#1a202c]"
                  }`}
                >
                  Verifikasi Admin{" "}
                  {status === "verified"
                    ? "(Selesai)"
                    : status === "rejected"
                      ? "(Ditolak)"
                      : "(Sedang Berjalan)"}
                </span>
              </div>

              <div className={`flex items-center gap-4 ${status !== "verified" ? "opacity-40" : ""}`}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    status === "verified" ? "bg-[#99BD4A]" : "bg-slate-100"
                  }`}
                >
                  {status === "verified" ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                </div>
                <span
                  className={`text-[14px] font-medium ${
                    status === "verified" ? "text-[#99BD4A] font-bold" : "text-slate-400"
                  }`}
                >
                  Aktivasi Akun &amp; Akses Koleksi
                </span>
              </div>
            </div>

            {/* Info tambahan */}
            <div className="mt-7 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Tanggal Daftar</p>
                  <p className="font-bold text-[#1a202c] text-[13px]">{formatDate(memberInfo.registration_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Nomor Registrasi</p>
                  <p className="font-bold text-[#1a202c] text-[13px]">{memberInfo.member_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Dokumen Identitas</p>
                  <p className="font-bold text-[#1a202c] text-[13px]">Telah Diunggah ✓</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            {status === "verified" ? (
              <Button
                className="flex-1 py-7 rounded-xl bg-[#99BD4A] hover:bg-[#85a440] text-white font-bold text-[14px] shadow-sm border-none flex items-center justify-center gap-2"
                onClick={() => router.push("/login")}
              >
                <LogIn className="w-4 h-4" /> Masuk ke Akun
              </Button>
            ) : (
              <Button
                className="flex-1 py-7 rounded-xl bg-[#99BD4A] hover:bg-[#85a440] text-white font-bold text-[14px] shadow-sm border-none flex items-center justify-center gap-2"
                onClick={handleContactAdmin}
              >
                <MessageSquareText className="w-4 h-4" /> Cek via WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 py-7 rounded-xl border-slate-200 text-slate-700 font-bold text-[14px] hover:bg-slate-50 flex items-center justify-center gap-2"
              onClick={handleContactAdmin}
            >
              Hubungi Bantuan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
