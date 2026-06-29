"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  BookOpen,
  FileText,
  Users,
  User,
  Mail,
  MapPin,
  CalendarDays,
  Camera,
  Save,
  Clock,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Heart,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StatusModal } from "@/components/ui/status-modal";
import { DigitalBookViewer } from "@/components/ui/digital-book-viewer";
import { CameraModal } from "@/components/ui/camera-modal";
import profilData from "@/json/profil.json";
import { useGetProfileQuery, useGetProfileStatsQuery, useLogoutMutation, useUpdateProfileMutation, useChangePasswordMutation } from "@/services/auth.service";
import { useMyLoansQuery, useGetDigitalStreamUrlMutation } from "@/services/loans.service";
import { useGetFavoriteBooksQuery } from "@/services/books.service";
import KoleksiCard from "@/components/katalog/koleksi-card";

export default function ProfilPage() {
  const router = useRouter();
  const [logoutApi] = useLogoutMutation();
  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePasswordApi, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const { data: profileApiData, refetch: refetchProfile } = useGetProfileQuery();
  const { data: statsApiData } = useGetProfileStatsQuery();
  const { data: loansRes, isLoading: isLoadingLoans } = useMyLoansQuery();
  const { data: favoritesRes, isLoading: isLoadingFavorites } = useGetFavoriteBooksQuery({ per_page: 5 });
  const [profile, setProfile] = useState<typeof profilData & { exp?: number }>({
    ...profilData,
    avatar: "",
    stats: { bukuDibaca: 0, sedangDipinjam: 0, poinKomunitas: 0 },
    kategoriFavorit: [],
    tags: [],
    aktivitasTerbaru: [],
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isConfirmAvatarOpen, setIsConfirmAvatarOpen] = useState(false);
  // State untuk change password
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  
  // Status Modal State
  const [statusModalType, setStatusModalType] = useState<"success" | "failed" | "reject">("success");
  const [statusModalTitle, setStatusModalTitle] = useState("");
  const [statusModalMessage, setStatusModalMessage] = useState("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  // Edit form state
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editWhatsapp, setEditWhatsapp] = useState(profile.whatsapp);
  const [editAddress, setEditAddress] = useState(profile.address);

  // Digital Book Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerToken, setViewerToken] = useState("");
  const [readingLoanId, setReadingLoanId] = useState<string | number | null>(null);
  const [getStreamUrl, { isLoading: isGettingStream }] = useGetDigitalStreamUrlMutation();

  useEffect(() => {
    if (profileApiData?.data?.user) {
      const user = profileApiData.data.user;
      const memberAddress = user.member?.address || user.address || "";
      const memberPhone = user.member?.phone || user.phone || "";
      const memberCode = user.member?.member_code || "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyUser = user as any;
      let rawAvatar = anyUser.member?.avatar_url || anyUser.member?.avatar || anyUser.avatar_url || anyUser.avatar || profile.avatar;
      if (rawAvatar && !rawAvatar.startsWith('http') && !rawAvatar.startsWith('/images') && !rawAvatar.startsWith('data:')) {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
        rawAvatar = `${baseUrl}/${rawAvatar.replace(/^\//, '')}`;
      }

      setProfile((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        whatsapp: memberPhone || prev.whatsapp,
        address: memberAddress || prev.address,
        member_code: memberCode || prev.member_code,
        status: (typeof user.status === "string" ? user.status.toUpperCase() : String(user.status)) || prev.status,
        avatar: rawAvatar,
        level: user.member?.level ? `LEVEL ${user.member.level}` : prev.level,
        exp: user.member?.exp ?? prev.exp,
      }));
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditWhatsapp(memberPhone || "");
      setEditAddress(memberAddress || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileApiData]);

  useEffect(() => {
    if (statsApiData?.data) {
      setProfile((prev) => ({
        ...prev,
        stats: statsApiData.data.stats || prev.stats,
        kategoriFavorit: statsApiData.data.kategoriFavorit || prev.kategoriFavorit,
        tags: statsApiData.data.tags || prev.tags,
        aktivitasTerbaru: statsApiData.data.aktivitasTerbaru || prev.aktivitasTerbaru,
      }));
    }
  }, [statsApiData]);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showModalAvatarMenu, setShowModalAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
    setAvatarPreview(imageDataUrl);
    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
      setAvatarFile(file);
      setIsConfirmAvatarOpen(true);
    } catch (e) {
      console.error("Failed to convert image data to file", e);
    }
  };

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditWhatsapp(profile.whatsapp);
    setEditAddress(profile.address);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("name", editName);
      formData.append("phone", editWhatsapp);
      formData.append("address", editAddress);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await updateProfileApi(formData).unwrap();
      // Update local state
      setProfile((prev) => ({
        ...prev,
        name: editName,
        whatsapp: editWhatsapp,
        address: editAddress,
      }));
      // Refresh profile data from server
      refetchProfile();
      setIsEditOpen(false);
      setIsSuccessOpen(true);
    } catch (error) {
      console.error("Update profile failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      // Optional: Clear tokens manually if needed, or API slice does it
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback
      router.push("/login");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordError("Password baru dan konfirmasi tidak cocok.");
      return;
    }
    if (passwordForm.password.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }
    try {
      await changePasswordApi(passwordForm).unwrap();
      setPasswordSuccess("Password berhasil diubah.");
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (error: unknown) {
      console.error("Change password failed:", error);
      const apiErr = error as { data?: { message?: string } };
      setPasswordError(apiErr?.data?.message || "Gagal mengubah password.");
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1100px] mx-auto w-full px-6 py-10">

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-6">
            {/* Avatar */}
            <div className="relative w-[120px] h-[120px] shrink-0">
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#B4D568] to-[#99BD4A] overflow-hidden ring-4 ring-white shadow-lg">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-extrabold">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    {profile.avatar && (
                      <Image
                        key={profile.avatar}
                        src={profile.avatar}
                        alt={profile.name}
                        fill
                        className="object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        unoptimized
                      />
                    )}
                  </>
                )}
              </div>
              {/* Camera button with dropdown */}
              <div className="absolute -bottom-1 -right-1 z-20">
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="w-8 h-8 bg-[#99BD4A] rounded-full flex items-center justify-center ring-3 ring-white shadow-sm hover:bg-[#87A840] transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                {showAvatarMenu && (
                  <div className="absolute bottom-10 -left-16 bg-white rounded-xl shadow-lg border border-slate-100 py-2 w-[160px] z-30">
                    <button
                      onClick={() => {
                        setShowAvatarMenu(false);
                        setIsCameraOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#334155] hover:bg-[#f4f7ee] transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-[#99BD4A]" />
                      Ambil Foto
                    </button>
                    <button
                      onClick={() => {
                        setShowAvatarMenu(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#334155] hover:bg-[#f4f7ee] transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-[#99BD4A]" />
                      Pilih File
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelected(file);
                    setIsConfirmAvatarOpen(true);
                  }
                }}
              />
            </div>

            {/* Name & Meta */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-1">
                {profile.name}
              </h1>
              <p className="text-[#64748b] text-[14px] font-medium flex items-center justify-center md:justify-start gap-2 mb-3">
                <CalendarDays className="w-4 h-4" />
                ID Anggota: {profile.member_code}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-[#99BD4A] text-[13px] font-bold">
                  {profile.status}
                </span>
                <span className="bg-[#f1f5f9] text-[#334155] text-[12px] font-bold px-3 py-1 rounded-lg border border-slate-200">
                  {profile.level}
                </span>
                {profile.exp !== undefined && (
                  <span className="bg-amber-50 text-amber-600 text-[12px] font-bold px-3 py-1 rounded-lg border border-amber-200">
                    {profile.exp} EXP
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={handleOpenEdit}
                className="flex items-center justify-center gap-2 bg-[#99BD4A] hover:bg-[#87A840] text-white px-6 py-3 rounded-xl font-bold text-[14px] transition-colors shadow-sm w-full sm:w-auto"
              >
                <Pencil className="w-4 h-4" />
                Edit Profil
              </button>
              <button
                onClick={() => {
                  setPasswordError("");
                  setPasswordSuccess("");
                  setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
                  setIsPasswordOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-[14px] transition-colors shadow-sm w-full sm:w-auto border border-slate-200"
              >
                <KeyRound className="w-4 h-4" />
                Ganti Password
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl font-bold text-[14px] transition-colors shadow-sm w-full sm:w-auto border border-red-100"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column — sticky */}
          <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-24 h-fit z-10">
            {/* Informasi Pribadi */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-[#99BD4A]" />
                <h3 className="text-[17px] font-extrabold text-[#0F172A]">
                  Informasi Pribadi
                </h3>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[#99BD4A] text-[11px] font-bold tracking-[0.12em] uppercase mb-1">
                    Email
                  </p>
                  <p className="text-[#1e293b] text-[14px] font-semibold">
                    {profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-[#99BD4A] text-[11px] font-bold tracking-[0.12em] uppercase mb-1">
                    WhatsApp
                  </p>
                  <p className="text-[#1e293b] text-[14px] font-semibold">
                    {profile.whatsapp}
                  </p>
                </div>
                <div>
                  <p className="text-[#99BD4A] text-[11px] font-bold tracking-[0.12em] uppercase mb-1">
                    Alamat
                  </p>
                  <p className="text-[#1e293b] text-[14px] font-semibold leading-relaxed">
                    {profile.address}
                  </p>
                </div>
                <div>
                  <p className="text-[#99BD4A] text-[11px] font-bold tracking-[0.12em] uppercase mb-1">
                    Anggota Sejak
                  </p>
                  <p className="text-[#1e293b] text-[14px] font-semibold">
                    {profile.memberSince}
                  </p>
                </div>
              </div>
            </div>

            {/* Kategori Favorit */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-[#99BD4A]" />
                <h3 className="text-[17px] font-extrabold text-[#0F172A]">
                  Kategori Favorit
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                {profile.kategoriFavorit.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-[#334155]">
                        {cat.label}
                      </span>
                      <span
                        className="text-[13px] font-bold"
                        style={{ color: cat.color }}
                      >
                        {cat.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 border border-slate-200 text-[12px] font-bold text-[#334155] rounded-lg bg-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column — col-span-2 */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Stats Row — full width above the grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#f4f7ee] flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-[#99BD4A]" />
                </div>
                <div>
                  <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
                    {profile.stats.bukuDibaca}
                  </p>
                  <p className="text-[#64748b] text-[13px] font-medium mt-1">
                    Buku Dibaca
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#f4f7ee] flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-[#99BD4A]" />
                </div>
                <div>
                  <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
                    {profile.stats.sedangDipinjam}
                  </p>
                  <p className="text-[#64748b] text-[13px] font-medium mt-1">
                    Sedang Dipinjam
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#f4f7ee] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-[#99BD4A]" />
                </div>
                <div>
                  <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
                    {profile.stats.poinKomunitas.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[#64748b] text-[13px] font-medium mt-1">
                    Poin Komunitas
                  </p>
                </div>
              </div>
            </div>

            {/* Aktivitas Terbaru */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#99BD4A]" />
                  <h3 className="text-[17px] font-extrabold text-[#0F172A]">
                    Aktivitas Terbaru
                  </h3>
                </div>
                <Link
                  href="/pinjaman"
                  className="text-[#99BD4A] text-[13px] font-bold hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {isLoadingLoans ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="w-8 h-8 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const recentLoans = (loansRes?.data as any)?.loans || [];
                  if (recentLoans.length === 0) {
                    return (
                      <div className="text-center py-8 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[#64748b] font-medium text-[14px]">Belum ada aktivitas terbaru.</p>
                      </div>
                    );
                  }
                  
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return recentLoans.slice(0, 5).map((loan: any) => {
                    let statusLabel = "SELESAI";
                    let statusColor = "#64748b";
                    
                    if (loan.status === "pending") {
                      statusLabel = "MENUNGGU PERSETUJUAN";
                      statusColor = "#d97706";
                    } else if (loan.status === "active" || loan.status === "overdue") {
                      statusLabel = "SEDANG DIPINJAM";
                      statusColor = "#8ca846";
                    } else if (loan.status === "rejected") {
                      statusLabel = "DITOLAK";
                      statusColor = "#dc2626";
                    }

                    const imagePath = loan.book?.image || loan.book?.cover_url || loan.book?.cover_path;
                    const image = imagePath && imagePath !== "" 
                      ? (imagePath.startsWith("http") || imagePath.startsWith("/") 
                          ? imagePath 
                          : `https://slims.web.id/web/${imagePath}`) 
                      : "";

                    return (
                      <div
                        key={loan.id}
                        className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[#F8F9FA] border border-slate-50"
                      >
                        {/* Book Thumbnail */}
                        <div className="relative w-[50px] h-[70px] sm:w-14 sm:h-[70px] rounded-lg bg-gradient-to-br from-[#d4c5a9] to-[#b8a88a] shrink-0 overflow-hidden shadow-sm">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white/60" />
                          </div>
                          {image && (
                            <Image
                              src={image}
                              alt={loan.book?.title || "Buku"}
                              fill
                              className="object-cover relative z-10"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                              unoptimized
                            />
                          )}
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0 pt-0.5 sm:pt-0">
                          <p className="text-[14px] sm:text-[15px] font-bold text-[#1e293b] leading-snug line-clamp-2 sm:line-clamp-1">
                            {loan.book?.title || "Buku Tanpa Judul"}
                          </p>
                          <p className="text-[#64748b] text-[12px] sm:text-[13px] font-medium truncate">
                            {loan.book?.author || "Penulis Tidak Diketahui"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-1.5">
                            <span
                              className="text-[10px] sm:text-[11px] font-bold text-white px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md whitespace-nowrap"
                              style={{ backgroundColor: statusColor }}
                            >
                              {statusLabel}
                            </span>
                            <span className="text-[#94a3b8] text-[11px] font-medium shrink-0">
                              • {new Date(loan.created_at).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>

                        {/* Read Button for Digital Book */}
                        {loan.status === "active" && loan.digital_access?.is_valid && (
                          <div className="shrink-0">
                            <button
                              onClick={async () => {
                                setReadingLoanId(loan.id);
                                try {
                                  const res = await getStreamUrl(loan.digital_access.access_token).unwrap();
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  const streamUrl = (res.data as any)?.stream_url;
                                  if (streamUrl) {
                                    setViewerUrl(streamUrl);
                                    setViewerTitle(loan.book?.title || "Buku");
                                    setViewerToken(loan.digital_access.access_token);
                                    setViewerOpen(true);
                                  } else {
                                    setStatusModalType("failed");
                                    setStatusModalTitle("Akses Gagal");
                                    setStatusModalMessage("Gagal memuat dokumen digital.");
                                    setStatusModalOpen(true);
                                  }
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                } catch (err: any) {
                                  setStatusModalType("failed");
                                  setStatusModalTitle("Akses Ditolak");
                                  setStatusModalMessage(err?.data?.message || "Token tidak valid atau kedaluwarsa.");
                                  setStatusModalOpen(true);
                                } finally {
                                  setReadingLoanId(null);
                                }
                              }}
                              disabled={isGettingStream && readingLoanId === loan.id}
                              className="bg-[#99BD4A] hover:bg-[#87a840] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                            >
                              <ExternalLink className={`w-3 h-3 ${isGettingStream && readingLoanId === loan.id ? "animate-pulse" : ""}`} />
                              {isGettingStream && readingLoanId === loan.id ? "Memuat..." : "Baca"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Koleksi Favorit */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  <h3 className="text-[17px] font-extrabold text-[#0F172A]">
                    Koleksi Favorit
                  </h3>
                </div>
                <Link
                  href="/katalog?tab=favorit"
                  className="text-[#99BD4A] text-[13px] font-bold hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>

              {isLoadingFavorites ? (
                <div className="flex justify-center items-center py-6">
                  <div className="w-8 h-8 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const favoriteBooks = ((favoritesRes?.data as any)?.data || (favoritesRes?.data as any)?.books || (favoritesRes?.data as any) || []) as any[];
                if (favoriteBooks.length === 0) {
                  return (
                    <div className="text-center py-8 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[#64748b] font-medium text-[14px]">Belum ada buku favorit.</p>
                      <Link href="/katalog" className="text-[#99BD4A] font-bold text-[13px] mt-2 inline-block hover:underline">Jelajahi Katalog</Link>
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {favoriteBooks.slice(0, 4).map((book: any) => (
                      <KoleksiCard key={book.id} biblio={book} />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Konfirmasi Avatar Modal */}
      <Dialog open={isConfirmAvatarOpen} onOpenChange={(open) => {
        setIsConfirmAvatarOpen(open);
        if (!open) {
          setAvatarPreview(null);
          setAvatarFile(null);
        }
      }}>
        <DialogContent className="w-[90vw] max-w-[400px] bg-white rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-[#f4f7ee] rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-[#99BD4A]" />
          </div>
          <h3 className="text-[18px] font-extrabold text-[#0F172A] mb-2">Konfirmasi Perubahan</h3>
          <p className="text-[#64748b] text-[14px] mb-6">
            Apakah Anda yakin ingin memperbarui foto profil Anda?
          </p>
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => {
                setIsConfirmAvatarOpen(false);
                setAvatarPreview(null);
                setAvatarFile(null);
              }}
              className="flex-1 py-3 text-[14px] font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={async () => {
                try {
                  const formData = new FormData();
                  formData.append("_method", "PUT");
                  formData.append("name", profile.name);
                  formData.append("phone", profile.whatsapp);
                  formData.append("address", profile.address);
                  if (avatarFile) {
                    formData.append("avatar", avatarFile);
                  }

                  await updateProfileApi(formData).unwrap();
                  refetchProfile();
                  setIsConfirmAvatarOpen(false);
                  setIsSuccessOpen(true);
                } catch (error) {
                  console.error("Update avatar failed:", error);
                }
              }}
              disabled={isUpdating}
              className="flex-1 py-3 text-[14px] font-bold text-white bg-[#99BD4A] rounded-xl hover:bg-[#87A840] transition-colors disabled:opacity-50"
            >
              {isUpdating ? "Menyimpan..." : "Ya, Simpan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0 bg-white rounded-[20px] border-0 shadow-2xl">
          {/* Header */}
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sticky top-0 bg-white z-40 border-b border-slate-100">
            <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#0F172A]">
              Edit Profil Peminjam
            </h2>
            <p className="text-[#64748b] text-[13px] sm:text-[14px] font-medium mt-1">
              Perbarui informasi akun Anda untuk layanan perpustakaan
            </p>
          </div>

           {/* Avatar Upload */}
          <div className="flex flex-col items-center py-6">
            <div className="relative w-[100px] h-[100px] mb-3">
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#B4D568] to-[#99BD4A] overflow-hidden ring-4 ring-white shadow-md">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-extrabold">
                      {editName.charAt(0).toUpperCase()}
                    </div>
                    {profile.avatar && (
                      <Image
                        key={profile.avatar}
                        src={profile.avatar}
                        alt={profile.name}
                        fill
                        className="object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        unoptimized
                      />
                    )}
                  </>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 z-20">
                <button
                  onClick={() => setShowModalAvatarMenu(!showModalAvatarMenu)}
                  className="w-8 h-8 bg-[#99BD4A] rounded-full flex items-center justify-center ring-2 ring-white shadow-sm hover:bg-[#87A840] transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                {showModalAvatarMenu && (
                  <div className="absolute bottom-10 -left-16 bg-white rounded-xl shadow-lg border border-slate-100 py-2 w-[160px] z-30">
                    <button
                      onClick={() => {
                        setShowModalAvatarMenu(false);
                        setIsEditOpen(false);
                        setTimeout(() => setIsCameraOpen(true), 200);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#334155] hover:bg-[#f4f7ee] transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-[#99BD4A]" />
                      Ambil Foto
                    </button>
                    <button
                      onClick={() => {
                        setShowModalAvatarMenu(false);
                        modalFileInputRef.current?.click();
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#334155] hover:bg-[#f4f7ee] transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-[#99BD4A]" />
                      Pilih File
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[14px] font-bold text-[#0F172A]">
              Unggah Foto Profil
            </p>
            <p className="text-[12px] text-[#94a3b8] font-medium">
              Format JPG, PNG maksimal 2MB
            </p>
            <button
              onClick={() => modalFileInputRef.current?.click()}
              className="mt-3 px-5 py-2 border border-[#99BD4A] text-[#99BD4A] rounded-lg text-[13px] font-bold hover:bg-[#f4f7ee] transition-colors"
            >
              Pilih File Baru
            </button>
            <input
              ref={modalFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
          </div>

          {/* Form */}
          <div className="px-5 sm:px-8 pb-4 flex flex-col gap-4 sm:gap-5">
            {/* Row 1: Nama & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                  Nama Lengkap
                </label>
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#99BD4A]/30 focus-within:border-[#99BD4A] transition-all">
                  <User className="w-4 h-4 text-[#94a3b8] shrink-0" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 text-[14px] text-[#1e293b] font-medium outline-none bg-transparent placeholder:text-[#c1c7cd]"
                    placeholder="Masukkan nama"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                  Alamat Email
                </label>
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#99BD4A]/30 focus-within:border-[#99BD4A] transition-all">
                  <Mail className="w-4 h-4 text-[#94a3b8] shrink-0" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="flex-1 text-[14px] text-[#1e293b] font-medium outline-none bg-transparent placeholder:text-[#c1c7cd]"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: WhatsApp & ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                  Nomor WhatsApp
                </label>
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#99BD4A]/30 focus-within:border-[#99BD4A] transition-all">
                  <span className="text-[#94a3b8] text-[13px] font-medium shrink-0">
                    +62
                  </span>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="flex-1 text-[14px] text-[#1e293b] font-medium outline-none bg-transparent placeholder:text-[#c1c7cd]"
                    placeholder="81234567890"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                  ID Anggota
                </label>
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50">
                  <CalendarDays className="w-4 h-4 text-[#94a3b8] shrink-0" />
                  <span className="text-[14px] text-[#94a3b8] font-medium">
                    {profile.member_code}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Alamat */}
            <div>
              <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                Alamat Lengkap
              </label>
              <div className="flex items-start gap-2.5 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#99BD4A]/30 focus-within:border-[#99BD4A] transition-all">
                <MapPin className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5" />
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="flex-1 text-[14px] text-[#1e293b] font-medium outline-none bg-transparent placeholder:text-[#c1c7cd] resize-none"
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 sticky bottom-0 bg-white z-40 border-t border-slate-100">
            <button
              onClick={() => setIsEditOpen(false)}
              className="w-full sm:w-auto px-8 py-3 sm:py-3 border border-slate-200 text-[#334155] rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-colors order-2 sm:order-1"
            >
              Batal
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isUpdating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 sm:py-3 bg-[#99BD4A] hover:bg-[#87A840] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[14px] transition-colors shadow-sm order-1 sm:order-2"
            >
              <Save className="w-4 h-4 shrink-0" />
              {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <StatusModal
        isOpen={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        status="success"
        title={
          <>
            Berhasil Mengubah
            <br />
            Profile!
          </>
        }
        description="Profil Anda berhasil diperbarui. Pastikan data yang Anda masukkan sudah benar. Perubahan dapat dilihat pada halaman profil Anda."
        actionLabel="Tutup"
        onAction={() => setIsSuccessOpen(false)}
      />

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCameraCapture}
      />

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[480px] p-0 bg-white rounded-[20px] border-0 shadow-2xl">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-[#f4f7ee] flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#99BD4A]" />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold text-[#0F172A]">Ganti Password</h2>
                <p className="text-[12px] text-[#64748b] font-medium">Perbarui password akun Anda</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleChangePassword} className="px-6 sm:px-8 py-6 flex flex-col gap-4">
            {/* Password Saat Ini */}
            <div>
              <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                Password Saat Ini
              </label>
              <div className="relative flex items-center border border-slate-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-[#99BD4A]/30 focus-within:border-[#99BD4A] transition-all">
                <Lock className="w-4 h-4 text-[#94a3b8] shrink-0" />
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                  className="flex-1 ml-2.5 py-3 text-[14px] text-[#1e293b] font-medium outline-none bg-transparent placeholder:text-[#c1c7cd]"
                  placeholder="Masukkan password saat ini"
                  required
                />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-[#94a3b8] hover:text-slate-600 focus:outline-none">
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                Password Baru
              </label>
              <div className="relative flex items-center border border-slate-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-[#99BD4A]/30 focus-within:border-[#99BD4A] transition-all">
                <Lock className="w-4 h-4 text-[#94a3b8] shrink-0" />
                <input
                  type={showNewPw ? "text" : "password"}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
                  className="flex-1 ml-2.5 py-3 text-[14px] text-[#1e293b] font-medium outline-none bg-transparent placeholder:text-[#c1c7cd]"
                  placeholder="Min. 8 karakter"
                  required
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-[#94a3b8] hover:text-slate-600 focus:outline-none">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password Baru */}
            <div>
              <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                Konfirmasi Password Baru
              </label>
              <div className="relative flex items-center border border-slate-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-[#99BD4A]/30 focus-within:border-[#99BD4A] transition-all">
                <Lock className="w-4 h-4 text-[#94a3b8] shrink-0" />
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                  className="flex-1 ml-2.5 py-3 text-[14px] text-[#1e293b] font-medium outline-none bg-transparent placeholder:text-[#c1c7cd]"
                  placeholder="Ulangi password baru"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-[#94a3b8] hover:text-slate-600 focus:outline-none">
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Pesan Error / Sukses */}
            {passwordError && (
              <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600 font-medium bg-green-50 px-4 py-2.5 rounded-xl border border-green-100">
                {passwordSuccess}
              </p>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPasswordOpen(false)}
                className="flex-1 py-3 border border-slate-200 text-[#334155] rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#99BD4A] hover:bg-[#87A840] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[14px] transition-colors"
              >
                <Save className="w-4 h-4 shrink-0" />
                {isChangingPassword ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        status={statusModalType}
        title={statusModalTitle}
        description={statusModalMessage}
        actionLabel="Tutup"
      />

      {/* PDF VIEWER MODAL */}
      <DigitalBookViewer 
        isOpen={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        fileUrl={viewerUrl} 
        title={viewerTitle}
        onExpand={() => router.push(`/baca/${viewerToken}`)}
      />

    </div>
  );
}
