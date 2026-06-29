"use client";

import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle, Lock, Settings2, Plus, Trash2 } from "lucide-react";
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from "@/services/admin-settings.service";
import { useChangePasswordMutation } from "@/services/auth.service";

// ── Feedback Toast ──────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-bold animate-in slide-in-from-bottom-4 fade-in duration-300 ${
      type === "success" ? "bg-[#99BD4A] text-white" : "bg-red-500 text-white"
    }`}>
      {type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
      {message}
    </div>
  );
}

export default function PengaturanPage() {
  // ── Settings State ──────────────────────────────────────────────
  const { data: settingsRes, isLoading: isLoadingSettings } = useGetAdminSettingsQuery();
  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateAdminSettingsMutation();

  const [finePerDay, setFinePerDay] = useState("");
  const [loanDurationDays, setLoanDurationDays] = useState("");
  const [adminWaPhones, setAdminWaPhones] = useState<string[]>([]);

  // Helper untuk parsing aman nomor WA dari API
  const parseWaPhones = (val: unknown): string[] => {
    if (Array.isArray(val)) return val as string[];
    if (typeof val === "string" && val.trim() !== "") {
      return val.split(",").map(s => s.trim());
    }
    return [];
  };

  // Sync from API when loaded
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = settingsRes?.data as any;
    if (!raw) return;
    // API returns array of { key, value } or an object
    if (Array.isArray(raw)) {
      const fineEntry = raw.find((s: { key: string }) => s.key === "fine_per_day");
      const durationEntry = raw.find((s: { key: string }) => s.key === "loan_duration_days");
      const waEntry = raw.find((s: { key: string }) => s.key === "admin_wa_phones");
      if (fineEntry) setFinePerDay(String(fineEntry.value));
      if (durationEntry) setLoanDurationDays(String(durationEntry.value));
      if (waEntry) setAdminWaPhones(parseWaPhones(waEntry.value));
    } else if (raw.settings) {
      setFinePerDay(String(raw.settings.fine_per_day ?? ""));
      setLoanDurationDays(String(raw.settings.loan_duration_days ?? ""));
      setAdminWaPhones(parseWaPhones(raw.settings.admin_wa_phones));
    } else {
      // flat object
      if (raw.fine_per_day !== undefined) setFinePerDay(String(raw.fine_per_day));
      if (raw.loan_duration_days !== undefined) setLoanDurationDays(String(raw.loan_duration_days));
      if (raw.admin_wa_phones !== undefined) {
        setAdminWaPhones(parseWaPhones(raw.admin_wa_phones));
      }
    }
  }, [settingsRes]);

  // ── Password State ──────────────────────────────────────────────
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // ── Toast ───────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  // ── Handlers ────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        settings: {
          fine_per_day: finePerDay,
          loan_duration_days: loanDurationDays,
          admin_wa_phones: adminWaPhones.filter(phone => phone.trim() !== ""),
        },
      }).unwrap();
      showToast("Kebijakan peminjaman berhasil disimpan!", "success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showToast(err?.data?.message ?? "Gagal menyimpan pengaturan.", "error");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Semua kolom kata sandi wajib diisi.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }).unwrap();
      showToast("Kata sandi berhasil diubah!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.data?.errors?.current_password?.[0] ?? "Kata sandi lama salah atau terjadi kesalahan.";
      setPasswordError(msg);
    }
  };

  // Password strength indicator
  const strength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2
    : 3;
  const strengthLabel = ["", "Lemah", "Sedang", "Kuat"][strength];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-[#99BD4A]"][strength];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <SiteHeader
        title="Pengaturan Sistem Perpustakaan"
        subtitle="Manajemen untuk mengatur sistem perpustakaan"
      />

      <main className="flex-1 p-8 w-full mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 mb-2">Pengaturan Sistem</h2>
          <p className="text-sm font-medium text-slate-500">
            Kelola konfigurasi sistem perpustakaan Rumah Kreatif Wadas Kelir
          </p>
        </div>

        <div className="space-y-6 pb-10">

          {/* ─── KEBIJAKAN PEMINJAMAN ─────────────────────────────── */}
          <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f0f5e8] flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-[#7a9e3b]" />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-slate-800 leading-tight">Kebijakan Peminjaman</h3>
                <p className="text-xs font-medium text-slate-400">Aturan denda dan durasi peminjaman buku.</p>
              </div>
            </div>

            {isLoadingSettings ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#99BD4A]" />
              </div>
            ) : (
              <>
                {/* Denda Per Hari */}
                <div className="flex flex-col md:flex-row md:items-center px-8 py-6 border-t border-slate-100 gap-4">
                  <div className="w-full md:w-2/5">
                    <p className="text-sm font-bold text-slate-800">Denda Per Hari</p>
                    <p className="text-xs text-slate-400 mt-0.5">Nominal denda keterlambatan per hari</p>
                  </div>
                  <div className="w-full md:w-3/5">
                    <div className="relative max-w-[200px]">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold pointer-events-none">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={finePerDay}
                        onChange={(e) => setFinePerDay(e.target.value)}
                        className="w-full border-2 border-slate-200 focus:border-[#99BD4A] rounded-xl h-11 pl-10 pr-4 font-bold text-slate-800 outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Durasi Peminjaman */}
                <div className="flex flex-col md:flex-row md:items-center px-8 py-6 border-t border-slate-100 gap-4">
                  <div className="w-full md:w-2/5">
                    <p className="text-sm font-bold text-slate-800">Durasi Pinjam Default</p>
                    <p className="text-xs text-slate-400 mt-0.5">Jumlah hari peminjaman standar</p>
                  </div>
                  <div className="w-full md:w-3/5 flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={loanDurationDays}
                      onChange={(e) => setLoanDurationDays(e.target.value)}
                      className="w-24 border-2 border-slate-200 focus:border-[#99BD4A] rounded-xl h-11 text-center font-bold text-slate-800 outline-none transition-colors text-sm"
                    />
                    <span className="text-sm text-slate-400 font-medium">Hari</span>
                  </div>
                </div>

                {/* WhatsApp Notifikasi Admin */}
                <div className="flex flex-col md:flex-row px-8 py-6 border-t border-slate-100 gap-4">
                  <div className="w-full md:w-2/5">
                    <p className="text-sm font-bold text-slate-800">No. WhatsApp Notifikasi Admin</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Daftar nomor WhatsApp admin untuk menerima notifikasi sistem (pendaftaran member baru, peminjaman, reaktivasi, dll).
                    </p>
                    <p className="text-[10px] text-amber-500 font-bold mt-1">
                      *Jika kosong, notifikasi dikirim ke nomor default dari server (.env).
                    </p>
                  </div>
                  <div className="w-full md:w-3/5 space-y-3">
                    {adminWaPhones.map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          placeholder="Contoh: 082322174978"
                          value={phone}
                          onChange={(e) => {
                            const newPhones = [...adminWaPhones];
                            newPhones[idx] = e.target.value;
                            setAdminWaPhones(newPhones);
                          }}
                          className="flex-1 border-2 border-slate-200 focus:border-[#99BD4A] rounded-xl h-11 px-4 font-bold text-slate-800 outline-none transition-colors text-sm"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            setAdminWaPhones(adminWaPhones.filter((_, i) => i !== idx));
                          }}
                          className="h-11 w-11 shrink-0 rounded-xl p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white border-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAdminWaPhones([...adminWaPhones, ""])}
                      className="border-dashed border-2 border-slate-200 text-slate-500 hover:text-[#99BD4A] hover:border-[#99BD4A] h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-transparent"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Nomor WhatsApp
                    </Button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="px-8 py-5 border-t border-slate-100 flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="bg-[#99BD4A] hover:bg-[#88ab3d] text-white font-bold h-10 px-6 rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2"
                  >
                    {isSavingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSavingSettings ? "Menyimpan..." : "Simpan Kebijakan"}
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* ─── KEAMANAN: GANTI PASSWORD ─────────────────────────── */}
          <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-slate-800 leading-tight">Keamanan</h3>
                <p className="text-xs font-medium text-slate-400">Perbarui kata sandi akses administrator.</p>
              </div>
            </div>

            {/* Kata Sandi Saat Ini */}
            <div className="flex flex-col md:flex-row md:items-center px-8 py-6 border-t border-slate-100 gap-4">
              <div className="w-full md:w-2/5">
                <p className="text-sm font-bold text-slate-800">Kata Sandi Saat Ini</p>
                <p className="text-xs text-slate-400 mt-0.5">Masukkan kata sandi lama Anda</p>
              </div>
              <div className="w-full md:w-3/5">
                <div className="relative max-w-md">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 border-slate-200 focus:border-slate-400 rounded-xl h-11 px-4 pr-12 font-medium text-slate-800 outline-none transition-colors text-sm placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Kata Sandi Baru */}
            <div className="flex flex-col md:flex-row md:items-start px-8 py-6 border-t border-slate-100 gap-4">
              <div className="w-full md:w-2/5 pt-1">
                <p className="text-sm font-bold text-slate-800">Kata Sandi Baru</p>
                <p className="text-xs text-slate-400 mt-0.5">Minimal 8 karakter</p>
              </div>
              <div className="w-full md:w-3/5">
                <div className="relative max-w-md">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 border-slate-200 focus:border-[#99BD4A] rounded-xl h-11 px-4 pr-12 font-medium text-slate-800 outline-none transition-colors text-sm placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Strength Bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2 max-w-md">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : "bg-slate-100"}`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-bold ${strength === 1 ? "text-red-400" : strength === 2 ? "text-yellow-500" : "text-[#99BD4A]"}`}>
                      Kekuatan: {strengthLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div className="flex flex-col md:flex-row md:items-center px-8 py-6 border-t border-slate-100 gap-4">
              <div className="w-full md:w-2/5">
                <p className="text-sm font-bold text-slate-800">Konfirmasi Kata Sandi</p>
                <p className="text-xs text-slate-400 mt-0.5">Ulangi kata sandi baru Anda</p>
              </div>
              <div className="w-full md:w-3/5">
                <div className="relative max-w-md">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full border-2 rounded-xl h-11 px-4 pr-12 font-medium text-slate-800 outline-none transition-colors text-sm placeholder:text-slate-300 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-300 focus:border-red-400"
                        : confirmPassword && confirmPassword === newPassword
                        ? "border-[#99BD4A] focus:border-[#99BD4A]"
                        : "border-slate-200 focus:border-[#99BD4A]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {confirmPassword && confirmPassword === newPassword && (
                    <CheckCircle2 className="absolute right-11 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99BD4A]" />
                  )}
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 max-w-md">Kata sandi tidak cocok</p>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {passwordError && (
              <div className="mx-8 mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </div>
            )}

            {/* Save Button */}
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-10 px-6 rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-40"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {isChangingPassword ? "Memproses..." : "Ubah Kata Sandi"}
              </Button>
            </div>
          </Card>

        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
