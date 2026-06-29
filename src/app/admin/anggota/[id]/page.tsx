"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusModal } from "@/components/ui/status-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Camera,
  Upload,
  X,
  RefreshCw,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  ShieldCheck,
  ShieldOff,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Save,
} from "lucide-react";
import Image from "next/image";
import {
  useMemberDetailQuery,
  useDeleteMemberMutation,
  useUpdateMemberMutation,
  useCreateMemberMutation,
} from "@/services/members.service";
import { isApiError } from "@/lib/error-utils";
import anggotaData from "@/json/anggota.json";

const memberDetails: Record<
  string,
  {
    joinDate: string;
    lastActive: string;
    address: string;
    occupation: string;
    loanHistory: { title: string; date: string; status: "dikembalikan" | "dipinjam" | "terlambat" }[];
    statsThisMonth: number;
    avgLoanDuration: string;
  }
> = {
  "#MEMBER-042": {
    joinDate: "12 Januari 2023",
    lastActive: "2 hari lalu",
    address: "Jl. Mawar No. 12, Kota Bandung",
    occupation: "Mahasiswa",
    statsThisMonth: 3,
    avgLoanDuration: "7 hari",
    loanHistory: [
      { title: "Pemrograman Web Modern", date: "10 Mei 2026", status: "dipinjam" },
      { title: "Sistem Basis Data", date: "28 Apr 2026", status: "dikembalikan" },
      { title: "Kecerdasan Buatan", date: "15 Apr 2026", status: "dikembalikan" },
    ],
  },
  "#MEMBER-039": {
    joinDate: "5 Maret 2023",
    lastActive: "1 minggu lalu",
    address: "Jl. Melati No. 7, Kota Surabaya",
    occupation: "Guru",
    statsThisMonth: 1,
    avgLoanDuration: "14 hari",
    loanHistory: [
      { title: "Metode Mengajar Efektif", date: "8 Mei 2026", status: "dipinjam" },
      { title: "Psikologi Pendidikan", date: "20 Apr 2026", status: "dikembalikan" },
    ],
  },
  "#MEMBER-012": {
    joinDate: "22 Juni 2022",
    lastActive: "3 bulan lalu",
    address: "Jl. Anggrek No. 3, Kota Jakarta",
    occupation: "Karyawan Swasta",
    statsThisMonth: 0,
    avgLoanDuration: "10 hari",
    loanHistory: [
      { title: "Manajemen Proyek", date: "10 Feb 2026", status: "terlambat" },
    ],
  },
  "#MEMBER-045": {
    joinDate: "14 Februari 2022",
    lastActive: "kemarin",
    address: "Jl. Kenanga No. 19, Kota Yogyakarta",
    occupation: "Dosen",
    statsThisMonth: 5,
    avgLoanDuration: "5 hari",
    loanHistory: [
      { title: "Riset Ilmiah & Metodologi", date: "12 Mei 2026", status: "dipinjam" },
      { title: "Statistika Terapan", date: "5 Mei 2026", status: "dipinjam" },
      { title: "Penulisan Akademik", date: "20 Apr 2026", status: "dikembalikan" },
      { title: "Filsafat Ilmu", date: "10 Apr 2026", status: "dikembalikan" },
    ],
  },
  "#MEMBER-022": {
    joinDate: "30 Agustus 2023",
    lastActive: "3 hari lalu",
    address: "Jl. Dahlia No. 5, Kota Semarang",
    occupation: "Mahasiswa",
    statsThisMonth: 1,
    avgLoanDuration: "9 hari",
    loanHistory: [
      { title: "Algoritma & Struktur Data", date: "9 Mei 2026", status: "dipinjam" },
      { title: "Jaringan Komputer", date: "1 Apr 2026", status: "dikembalikan" },
    ],
  },
  "#MEMBER-008": {
    joinDate: "10 September 2021",
    lastActive: "6 bulan lalu",
    address: "Jl. Cempaka No. 11, Kota Medan",
    occupation: "Wiraswasta",
    statsThisMonth: 0,
    avgLoanDuration: "12 hari",
    loanHistory: [
      { title: "Bisnis Digital", date: "15 Nov 2025", status: "terlambat" },
    ],
  },
  "#MEMBER-050": {
    joinDate: "3 April 2024",
    lastActive: "4 hari lalu",
    address: "Jl. Tulip No. 8, Kota Makassar",
    occupation: "Mahasiswa",
    statsThisMonth: 2,
    avgLoanDuration: "8 hari",
    loanHistory: [
      { title: "Cloud Computing", date: "11 Mei 2026", status: "dipinjam" },
      { title: "Pemrograman Mobile", date: "25 Apr 2026", status: "dikembalikan" },
      { title: "UI/UX Design", date: "10 Apr 2026", status: "dikembalikan" },
    ],
  },
  "#MEMBER-033": {
    joinDate: "18 November 2022",
    lastActive: "hari ini",
    address: "Jl. Roselia No. 2, Kota Denpasar",
    occupation: "Peneliti",
    statsThisMonth: 4,
    avgLoanDuration: "6 hari",
    loanHistory: [
      { title: "Bioinformatika", date: "13 Mei 2026", status: "dipinjam" },
      { title: "Genetika Modern", date: "6 Mei 2026", status: "dipinjam" },
      { title: "Ekologi & Lingkungan", date: "22 Apr 2026", status: "dikembalikan" },
      { title: "Kimia Organik Lanjut", date: "8 Apr 2026", status: "dikembalikan" },
      { title: "Fisika Kuantum", date: "25 Mar 2026", status: "dikembalikan" },
    ],
  },
  "#MEMBER-017": {
    joinDate: "7 Juli 2022",
    lastActive: "5 bulan lalu",
    address: "Jl. Bougenville No. 14, Kota Palembang",
    occupation: "Pegawai Negeri",
    statsThisMonth: 0,
    avgLoanDuration: "11 hari",
    loanHistory: [
      { title: "Hukum Administrasi Negara", date: "5 Dec 2025", status: "dikembalikan" },
      { title: "Tata Kelola Pemerintahan", date: "20 Nov 2025", status: "terlambat" },
    ],
  },
  "#MEMBER-048": {
    joinDate: "25 Januari 2024",
    lastActive: "kemarin",
    address: "Jl. Seroja No. 6, Kota Balikpapan",
    occupation: "Mahasiswa",
    statsThisMonth: 4,
    avgLoanDuration: "7 hari",
    loanHistory: [
      { title: "Teknik Sipil Dasar", date: "12 Mei 2026", status: "dipinjam" },
      { title: "Mekanika Tanah", date: "4 Mei 2026", status: "dipinjam" },
      { title: "Beton Bertulang", date: "18 Apr 2026", status: "dikembalikan" },
      { title: "Drainase Perkotaan", date: "5 Apr 2026", status: "dikembalikan" },
    ],
  },
};

const loanStatusCfg = {
  dikembalikan: {
    label: "Dikembalikan",
    icon: CheckCircle2,
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-500",
  },
  dipinjam: {
    label: "Dipinjam",
    icon: BookOpen,
    className: "text-blue-600 bg-blue-50 border-blue-200",
    iconColor: "text-blue-500",
  },
  terlambat: {
    label: "Terlambat",
    icon: AlertCircle,
    className: "text-red-600 bg-red-50 border-red-200",
    iconColor: "text-red-500",
  },
};

export default function DynamicAnggotaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { id } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  const decodedId = decodeURIComponent(id);
  const router = useRouter();

  const isAddMode = decodedId === "tambah";
  const [isEditing, setIsEditing] = useState(resolvedSearchParams.edit === "true");

  // Fetch Member Details
  const { data: memberDetailRes, isLoading: isFetching } = useMemberDetailQuery(
    decodedId,
    { skip: isAddMode || !decodedId }
  );

  const [deleteMemberApi, { isLoading: isDeleting }] = useDeleteMemberMutation();
  const [updateMemberApi, { isLoading: isUpdating }] = useUpdateMemberMutation();
  const [createMember, { isLoading: isCreating }] = useCreateMemberMutation();

  const fallback = anggotaData.find((m) => m.id === decodedId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let member: any = fallback;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiMember: any = null;

  if (!isAddMode && memberDetailRes?.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = memberDetailRes.data as any;
    const user = m.user ?? {};
    apiMember = m;
    member = {
      ...(fallback || {}),
      id: m.member_code || m.nik_nisn || m.id?.toString() || decodedId,
      numericId: m.id,
      name: user.name || m.name || "Tanpa Nama",
      email: user.email || m.email || "Tidak ada email",
      role: user.role || m.role || "Anggota",
      status: (user.status || m.status) === "active" ? "AKTIF" : (user.status || m.status) === "suspended" ? "DITANGGUHKAN" : "MENUNGGU",
      phone: m.phone || "-",
      loans: m.total_loans || fallback?.loans || 0,
      initials: (user.name || m.name || "A").substring(0, 2).toUpperCase(),
      color: fallback?.color || "bg-emerald-500",
    };
  }

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    nik_nisn: "",
    id_type: "ktp" as "ktp" | "kk" | "kartu_pelajar",
    phone: "",
    address: "",
    birth_date: "",
    guardian_name: "",
    guardian_nik: "",
    guardian_phone: "",
    status: "active",
  });

  // Dokumen Identitas State
  const [uploadMode, setUploadMode] = useState<"upload" | "camera">("upload");
  const [identityDocFile, setIdentityDocFile] = useState<File | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Camera references
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayBoxRef = useRef<HTMLDivElement>(null);

  // UI State
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sync Search Param edit state
  useEffect(() => {
    setIsEditing(resolvedSearchParams.edit === "true");
  }, [resolvedSearchParams.edit]);

  // Pre-populate Form on Edit Mode
  useEffect(() => {
    if (!isAddMode && memberDetailRes?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = memberDetailRes.data as any;
      const user = m.user ?? {};
      setFormData({
        name: user.name || m.name || "",
        email: user.email || m.email || "",
        password: "",
        password_confirmation: "",
        nik_nisn: m.nik_nisn || "",
        id_type: (m.id_type as "ktp" | "kk" | "kartu_pelajar") || "ktp",
        phone: m.phone || "",
        address: m.address || "",
        birth_date: m.birth_date || "",
        guardian_name: m.guardian_name || "",
        guardian_nik: m.guardian_nik || "",
        guardian_phone: m.guardian_phone || "",
        status: user.status || m.status || "active",
      });
    }
  }, [memberDetailRes, isAddMode]);

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  if (!isAddMode && isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="w-8 h-8 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAddMode && !member) {
    notFound();
  }

  const defaultDetails = {
    joinDate: "1 Januari 2023",
    lastActive: "Tidak diketahui",
    address: "-",
    occupation: "-",
    statsThisMonth: 0,
    avgLoanDuration: "-",
    loanHistory: [],
  };

  const details = member ? (memberDetails[member.id] ?? defaultDetails) : defaultDetails;

  if (!isAddMode && memberDetailRes?.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = memberDetailRes.data as any;
    details.joinDate = m.created_at ? new Date(m.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : defaultDetails.joinDate;
    details.address = m.address || defaultDetails.address;
  }

  const isActive = member ? member.status === "AKTIF" : false;

  // Start Camera Stream
  const startCamera = async () => {
    setErrorMsg("");
    setIsCameraActive(true);
    setCapturedImage(null);
    setIdentityDocFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMediaStream(stream);
    } catch (err) {
      console.error("Gagal membuka kamera:", err);
      setErrorMsg("Gagal mengakses kamera. Pastikan izin akses kamera telah diberikan.");
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture Photo & Crop automatically
  const capturePhoto = () => {
    if (!videoRef.current || !overlayBoxRef.current || !videoRef.current.videoWidth) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    const scaleX = vWidth / displayWidth;
    const scaleY = vHeight / displayHeight;

    const box = overlayBoxRef.current;
    const boxRect = box.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    const sx = (boxRect.left - videoRect.left) * scaleX;
    const sy = (boxRect.top - videoRect.top) * scaleY;
    const sWidth = boxRect.width * scaleX;
    const sHeight = boxRect.height * scaleY;

    canvas.width = sWidth;
    canvas.height = sHeight;

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `capture_identitas_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setIdentityDocFile(file);

          const reader = new FileReader();
          reader.onloadend = () => {
            setCapturedImage(reader.result as string);
          };
          reader.readAsDataURL(blob);

          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next.identity_doc;
            return next;
          });
        }
      },
      "image/jpeg",
      0.95
    );

    stopCamera();
  };

  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      password,
      password_confirmation: password,
    }));
    setShowPasswordText(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectIdType = (value: "ktp" | "kk" | "kartu_pelajar") => {
    setFormData((prev) => ({
      ...prev,
      id_type: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIdentityDocFile(file);
      setCapturedImage(null);
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.identity_doc;
        return next;
      });
    }
  };

  const handleRemoveFile = () => {
    setIdentityDocFile(null);
    setCapturedImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setValidationErrors({});

    if (isAddMode) {
      if (formData.password !== formData.password_confirmation) {
        setValidationErrors({
          password_confirmation: ["Konfirmasi kata sandi tidak cocok."],
        });
        return;
      }

      if (!identityDocFile) {
        setValidationErrors({
          identity_doc: ["Dokumen identitas (KTP/KK/Kartu Pelajar) wajib diunggah/dipotret."],
        });
        return;
      }

      try {
        const payload = new FormData();
        payload.append("name", formData.name);
        payload.append("email", formData.email);
        payload.append("password", formData.password);
        payload.append("password_confirmation", formData.password_confirmation);
        payload.append("nik_nisn", formData.nik_nisn);
        payload.append("id_type", formData.id_type);

        if (formData.phone) payload.append("phone", formData.phone);
        if (formData.address) payload.append("address", formData.address);
        if (formData.birth_date) payload.append("birth_date", formData.birth_date);
        if (formData.guardian_name) payload.append("guardian_name", formData.guardian_name);
        if (formData.guardian_nik) payload.append("guardian_nik", formData.guardian_nik);
        if (formData.guardian_phone) payload.append("guardian_phone", formData.guardian_phone);
        payload.append("identity_doc", identityDocFile);

        const response = await createMember(payload).unwrap();
        if (response.success) {
          setShowSuccessModal(true);
        } else {
          setErrorMsg(response.message || "Gagal mendaftarkan anggota baru.");
        }
      } catch (err: unknown) {
        console.error("Create member failed:", err);
        if (isApiError(err)) {
          if (err.status === 422 && err.data?.errors) {
            setValidationErrors(err.data.errors);
          } else {
            setErrorMsg(err.data?.message || "Terjadi kesalahan server.");
          }
        } else if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Terjadi kesalahan yang tidak diketahui.");
        }
      }
    } else {
      // Edit Mode
      try {
        const payload = {
          id: member.numericId,
          name: formData.name,
          email: formData.email,
          status: formData.status,
          nik_nisn: formData.nik_nisn,
          id_type: formData.id_type,
          phone: formData.phone || "",
          address: formData.address || "",
          birth_date: formData.birth_date || "",
          guardian_name: formData.guardian_name || "",
          guardian_nik: formData.guardian_nik || "",
          guardian_phone: formData.guardian_phone || "",
        };

        const response = await updateMemberApi(payload).unwrap();
        if (response.success) {
          setShowSuccessModal(true);
        } else {
          setErrorMsg(response.message || "Gagal memperbarui data anggota.");
        }
      } catch (err: unknown) {
        console.error("Update member failed:", err);
        if (isApiError(err)) {
          if (err.status === 422 && err.data?.errors) {
            setValidationErrors(err.data.errors);
          } else {
            setErrorMsg(err.data?.message || "Terjadi kesalahan server.");
          }
        } else if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Terjadi kesalahan yang tidak diketahui.");
        }
      }
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    if (!member) return;
    try {
      const numericId = member.numericId ?? decodedId;
      await deleteMemberApi(numericId).unwrap();
      setShowDeleteSuccess(true);
    } catch (err) {
      console.error("Delete member failed:", err);
      setDeleteError("Gagal menghapus anggota. Silakan coba lagi.");
      setShowDeleteConfirm(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (isAddMode) {
      router.push("/admin/anggota");
    } else {
      setIsEditing(false);
      router.push(`/admin/anggota/${member.numericId}`, { scroll: false });
    }
  };

  // Rendering conditional: FORM VIEW (Add or Edit) vs DETAIL VIEW
  if (isAddMode || isEditing) {
    const isSaving = isCreating || isUpdating;
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scanLaser {
            0% { top: 0%; }
            100% { top: 100%; }
          }
          .animate-scan-laser {
            animation: scanLaser 2s linear infinite alternate;
          }
        `}} />

        <SiteHeader
          title={isAddMode ? "Tambah Anggota Baru" : "Edit Anggota"}
          subtitle={isAddMode ? "Mendaftarkan anggota baru secara langsung oleh admin" : "Perbarui informasi pribadi dan status keanggotaan"}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Navigation Back */}
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-slate-600 hover:text-slate-900"
              onClick={() => {
                stopCamera();
                if (isAddMode) {
                  router.push("/admin/anggota");
                } else {
                  setIsEditing(false);
                  router.push(`/admin/anggota/${member.numericId}`, { scroll: false });
                }
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke {isAddMode ? "Manajemen Anggota" : "Detail Anggota"}
            </Button>
          </div>

          {/* Dynamic Status Banner (Edit Mode only, at the very top of page) */}
          {!isAddMode && isEditing && (
            <div className={`p-5 rounded-3xl border transition-all duration-300 ${
              formData.status === "active"
                ? "bg-gradient-to-r from-emerald-50/90 to-teal-50/40 border-emerald-200 shadow-sm"
                : "bg-gradient-to-r from-rose-50/90 to-slate-50/40 border-rose-200 shadow-sm"
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${
                    formData.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  }`}>
                    {formData.status === "active" ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <ShieldOff className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                      Status Keanggotaan: {formData.status === "active" ? "AKTIF" : formData.status === "suspended" ? "DITANGGUHKAN" : formData.status === "banned" ? "DIBLOKIR" : "NONAKTIF"}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {formData.status === "active"
                        ? "Anggota dapat melakukan peminjaman buku dan mengakses layanan perpustakaan secara penuh."
                        : "Akses peminjaman dan layanan perpustakaan ditangguhkan sementara."}
                    </p>
                  </div>
                </div>

                {/* Dropdown status switcher inside the banner */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UBAH STATUS:</span>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger className={`w-36 font-bold rounded-xl h-10 border shadow-sm focus:ring-0 ${
                      formData.status === "active"
                        ? "bg-white border-emerald-200 text-emerald-600 focus:border-emerald-300"
                        : "bg-white border-rose-200 text-rose-600 focus:border-rose-300"
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                      <SelectItem value="suspended">Ditangguhkan</SelectItem>
                      <SelectItem value="banned">Diblokir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <Card className="shadow-md border-slate-100 rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Account Data */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
                    1. Informasi Akun
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Masukkan nama lengkap"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="bg-slate-50/50"
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-red-500">{validationErrors.name[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contoh@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="bg-slate-50/50"
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-red-500">{validationErrors.email[0]}</p>
                      )}
                    </div>

                    {isAddMode && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="password">Kata Sandi <span className="text-red-500">*</span></Label>
                          <div className="relative">
                            <Input
                              id="password"
                              name="password"
                              type={showPasswordText ? "text" : "password"}
                              placeholder="Minimal 8 karakter"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                              className="bg-slate-50/50 pr-24"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPasswordText(!showPasswordText)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded animate-none"
                              >
                                {showPasswordText ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleGeneratePassword}
                                className="h-8 px-2 text-[10px] text-[#99BD4A] hover:text-[#99BD4A]/80 hover:bg-[#99BD4A]/10 gap-1 font-bold"
                                title="Generate password acak"
                              >
                                <Sparkles className="w-3 h-3" />
                                Acak
                              </Button>
                            </div>
                          </div>
                          {validationErrors.password && (
                            <p className="text-xs text-red-500">{validationErrors.password[0]}</p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi <span className="text-red-500">*</span></Label>
                          <Input
                            id="password_confirmation"
                            name="password_confirmation"
                            type={showPasswordText ? "text" : "password"}
                            placeholder="Ulangi kata sandi"
                            value={formData.password_confirmation}
                            onChange={handleInputChange}
                            required
                            className="bg-slate-50/50"
                          />
                          {validationErrors.password_confirmation && (
                            <p className="text-xs text-red-500">{validationErrors.password_confirmation[0]}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 2: Personal & Identity Data */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
                    2. Data Personal & Identitas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="id_type">Tipe Identitas <span className="text-red-500">*</span></Label>
                      <Select value={formData.id_type} onValueChange={handleSelectIdType}>
                        <SelectTrigger className="bg-slate-50/50">
                          <SelectValue placeholder="Pilih jenis identitas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ktp">KTP (Kependudukan / Orang Tua)</SelectItem>
                          <SelectItem value="kk">KK (Kartu Keluarga)</SelectItem>
                          <SelectItem value="kartu_pelajar">Kartu Pelajar / Foto Anak</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.id_type && (
                        <p className="text-xs text-red-500">{validationErrors.id_type[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="nik_nisn">Nomor NIK / NISN <span className="text-red-500">*</span></Label>
                      <Input
                        id="nik_nisn"
                        name="nik_nisn"
                        placeholder="Masukkan NIK atau NISN"
                        value={formData.nik_nisn}
                        onChange={handleInputChange}
                        required
                        className="bg-slate-50/50"
                      />
                      {validationErrors.nik_nisn && (
                        <p className="text-xs text-red-500">{validationErrors.nik_nisn[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone">Nomor WhatsApp (Opsional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="Contoh: 081234567890"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="bg-slate-50/50"
                      />
                      {validationErrors.phone && (
                        <p className="text-xs text-red-500">{validationErrors.phone[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="birth_date">Tanggal Lahir (Opsional)</Label>
                      <Input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={handleInputChange}
                        className="bg-slate-50/50"
                      />
                      {validationErrors.birth_date && (
                        <p className="text-xs text-red-500">{validationErrors.birth_date[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="address">Alamat Lengkap (Opsional)</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Masukkan alamat tinggal saat ini"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="bg-slate-50/50"
                      />
                      {validationErrors.address && (
                        <p className="text-xs text-red-500">{validationErrors.address[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* IDENTITY DOCUMENT UPLOAD/CAMERA (Add Mode Only) */}
                  {isAddMode && (
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <Label className="text-sm font-bold text-slate-700">
                          Dokumen Identitas (KTP/KK/Kartu Pelajar/Foto Wajah) <span className="text-red-500">*</span>
                        </Label>
                        
                        {!isCameraActive && (
                          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadMode("upload");
                                handleRemoveFile();
                              }}
                              className={`h-8 rounded-lg text-xs font-bold px-3 py-1 ${
                                uploadMode === "upload"
                                  ? "bg-white text-slate-800 shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              Upload Berkas
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadMode("camera");
                                handleRemoveFile();
                                startCamera();
                              }}
                              className={`h-8 rounded-lg text-xs font-bold px-3 py-1 ${
                                uploadMode === "camera"
                                  ? "bg-white text-slate-800 shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5 mr-1.5" />
                              Ambil Kamera
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* DOCUMENT INTERFACE BOX */}
                      <div className="border border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50/30">
                        {uploadMode === "upload" && (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            {identityDocFile ? (
                              <div className="flex items-center gap-4 bg-white border border-slate-150 p-4 rounded-2xl w-full max-w-md shadow-sm">
                                <div className="p-3 bg-[#99BD4A]/10 text-[#99BD4A] rounded-xl shrink-0">
                                  <Upload className="w-6 h-6" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate">
                                    {identityDocFile.name}
                                  </p>
                                  <p className="text-xs text-slate-400 font-medium">
                                    {(identityDocFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleRemoveFile}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex flex-col items-center group">
                                <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                  <Upload className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#99BD4A]">
                                  Pilih atau Seret File di sini
                                </span>
                                <span className="text-xs text-slate-400 font-medium mt-1">
                                  Format: JPG, JPEG, PNG, PDF, atau WEBP (Maks. 2MB)
                                </span>
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        )}

                        {uploadMode === "camera" && isCameraActive && (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative w-full max-w-md aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-100">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                  ref={overlayBoxRef}
                                  className="w-[85%] aspect-[1.58/1] border-2 border-dashed border-[#99BD4A] rounded-xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]"
                                >
                                  <div className="absolute left-0 right-0 h-0.5 bg-[#99BD4A] shadow-[0_0_6px_#99BD4A] animate-scan-laser" />
                                </div>
                              </div>
                              <div className="absolute top-3 left-3 text-center pointer-events-none">
                                <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm tracking-wider">
                                  KAMERA AKTIF
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  stopCamera();
                                  setUploadMode("upload");
                                }}
                                className="rounded-xl px-4 h-10 border-slate-200 text-slate-600"
                              >
                                Tutup
                              </Button>
                              <Button
                                type="button"
                                onClick={capturePhoto}
                                className="bg-[#99BD4A] hover:bg-[#85a63e] text-white font-bold rounded-xl px-6 h-10 gap-2 shadow-sm"
                              >
                                <Camera className="w-4 h-4" />
                                Ambil Gambar
                              </Button>
                            </div>
                          </div>
                        )}

                        {uploadMode === "camera" && !isCameraActive && capturedImage && (
                          <div className="flex flex-col items-center gap-4 py-2">
                            <div className="relative w-64 aspect-[1.58/1] rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                              <Image
                                src={capturedImage}
                                alt="Captured identity document"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>

                            <div className="flex flex-col items-center text-center">
                              <p className="text-xs font-bold text-slate-700">
                                Gambar Berhasil Diambil
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {(identityDocFile!.size / 1024).toFixed(1)} KB (Cropped)
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    handleRemoveFile();
                                    setUploadMode("upload");
                                  }}
                                  className="rounded-xl px-4 h-9 border-slate-200 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                                >
                                  <X className="w-3.5 h-3.5 mr-1" />
                                  Hapus
                                </Button>
                                <Button
                                  type="button"
                                  onClick={startCamera}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl px-4 h-9 gap-1 text-xs"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Foto Ulang
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {uploadMode === "camera" && !isCameraActive && !capturedImage && (
                          <div className="flex flex-col items-center py-6 text-center">
                            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-3">
                              <Camera className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                              Kamera Siap Digunakan
                            </span>
                            <Button
                              type="button"
                              onClick={startCamera}
                              className="mt-3 bg-[#99BD4A] hover:bg-[#85a63e] text-white font-bold rounded-xl px-5 h-10 gap-1.5"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Aktifkan Kamera
                            </Button>
                          </div>
                        )}
                      </div>
                      {validationErrors.identity_doc && (
                        <p className="text-xs text-red-500">{validationErrors.identity_doc[0]}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 3: Parent / Guardian Data */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800">
                      3. Data Orang Tua / Wali (Opsional)
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Isi jika mendaftarkan anak-anak</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="guardian_name">Nama Wali</Label>
                      <Input
                        id="guardian_name"
                        name="guardian_name"
                        placeholder="Nama orang tua/wali"
                        value={formData.guardian_name}
                        onChange={handleInputChange}
                        className="bg-slate-50/50"
                      />
                      {validationErrors.guardian_name && (
                        <p className="text-xs text-red-500">{validationErrors.guardian_name[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="guardian_nik">NIK Wali</Label>
                      <Input
                        id="guardian_nik"
                        name="guardian_nik"
                        placeholder="NIK orang tua/wali"
                        value={formData.guardian_nik}
                        onChange={handleInputChange}
                        className="bg-slate-50/50"
                      />
                      {validationErrors.guardian_nik && (
                        <p className="text-xs text-red-500">{validationErrors.guardian_nik[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="guardian_phone">No. HP Wali</Label>
                      <Input
                        id="guardian_phone"
                        name="guardian_phone"
                        placeholder="HP orang tua/wali"
                        value={formData.guardian_phone}
                        onChange={handleInputChange}
                        className="bg-slate-50/50"
                      />
                      {validationErrors.guardian_phone && (
                        <p className="text-xs text-red-500">{validationErrors.guardian_phone[0]}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Alert */}
                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      stopCamera();
                      if (isAddMode) {
                        router.push("/admin/anggota");
                      } else {
                        setIsEditing(false);
                        router.push(`/admin/anggota/${member.numericId}`, { scroll: false });
                      }
                    }}
                    disabled={isSaving}
                    className="rounded-xl px-6 h-12"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#99BD4A] hover:bg-[#85a63e] text-white font-bold rounded-xl px-8 h-12 gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isAddMode ? "Simpan Anggota" : "Simpan Perubahan"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>

        {/* Success Modal */}
        <StatusModal
          isOpen={showSuccessModal}
          onOpenChange={(open) => {
            if (!open) handleSuccessClose();
          }}
          status="success"
          title={isAddMode ? "Anggota Berhasil Didaftarkan!" : "Data Anggota Berhasil Diubah!"}
          description={isAddMode ? "Akun anggota baru telah dibuat dan langsung berstatus aktif di dalam sistem." : "Profil Anggota berhasil diperbarui. Perubahan dapat dilihat oleh Anggota terkait."}
          actionLabel="Tutup"
          onAction={handleSuccessClose}
        />
      </div>
    );
  }

  // Otherwise, render existing DETAIL VIEW
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Manajemen Anggota"
        subtitle="Informasi detail anggota perpustakaan"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className="hover:text-slate-900 transition-colors"
          >
            DASHBOARD
          </Link>
          <span>›</span>
          <Link
            href="/admin/anggota"
            className="hover:text-slate-900 transition-colors"
          >
            ANGGOTA
          </Link>
          <span>›</span>
          <span className="text-slate-900">{member.name.toUpperCase()}</span>
        </div>

        {/* Page Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="w-9 h-9" asChild>
              <Link href="/admin/anggota">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Detail Anggota
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Informasi lengkap profil dan aktivitas anggota
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 text-sm font-semibold border-slate-200 hover:border-slate-300"
              onClick={() => {
                setIsEditing(true);
                router.push(`/admin/anggota/${member.numericId}?edit=true`, { scroll: false });
              }}
            >
              <Edit className="w-4 h-4" />
              Edit Anggota
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-sm font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <Card className="shadow-sm border-slate-100 overflow-hidden">
              <div className="h-20 bg-gradient-to-br from-[#99BD4A]/20 via-[#99BD4A]/10 to-slate-50" />
              <CardContent className="px-6 pb-6 -mt-10">
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-2xl border-4 border-white shadow-md ${member.color}`}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {member.name}
                    </h2>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {member.id}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {isActive ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldOff className="w-3.5 h-3.5" />
                    )}
                    {member.status}
                  </div>
                </div>

                <hr className="my-5 border-slate-100" />

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="font-semibold text-slate-700">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        No. WhatsApp
                      </p>
                      <p className="font-semibold text-slate-700">
                        {member.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tanggal Bergabung
                      </p>
                      <p className="font-semibold text-slate-700">
                        {details.joinDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Terakhir Aktif
                      </p>
                      <p className="font-semibold text-slate-700">
                        {details.lastActive}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="shadow-sm border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  Statistik Peminjaman
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#99BD4A]/5 rounded-xl border border-[#99BD4A]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#99BD4A]/15 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#99BD4A]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Pinjaman
                      </p>
                      <p className="text-2xl font-extrabold text-slate-900">
                        {member.loans}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Buku</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <TrendingUp className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-xl font-extrabold text-slate-900">
                      {details.statsThisMonth}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Bulan Ini
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-xl font-extrabold text-slate-900">
                      {details.avgLoanDuration}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Rata-rata
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Info Card */}
            <Card className="shadow-sm border-slate-100">
              <CardHeader className="bg-slate-50/80 py-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-700 tracking-wider uppercase">
                  Informasi Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nama Lengkap
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {member.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kode Anggota
                    </p>
                    <p className="text-base font-semibold text-slate-900 font-mono">
                      {member.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      NIK / NISN
                    </p>
                    <p className="text-base font-semibold text-slate-900 font-mono tracking-widest">
                      {apiMember?.nik_nisn || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Jenis Identitas
                    </p>
                    <p className="text-base font-semibold text-slate-900 uppercase">
                      {apiMember?.id_type || details.occupation || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal Lahir
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {apiMember?.birth_date
                        ? new Date(apiMember.birth_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kategori Usia
                    </p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      apiMember?.age_category === "adult"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {apiMember?.age_category === "adult" ? `Dewasa (${apiMember?.age} th)` : `Anak (${apiMember?.age} th)` }
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status Keanggotaan
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? "bg-green-500" : "bg-slate-400"
                        }`}
                      />
                      <p
                        className={`text-base font-bold ${
                          isActive ? "text-green-600" : "text-slate-500"
                        }`}
                      >
                        {member.status}
                      </p>
                    </div>
                  </div>
                  {apiMember?.guardian_name && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Nama Wali
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {apiMember.guardian_name}
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Alamat
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {apiMember?.address || details.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan History Card */}
            <Card className="shadow-sm border-slate-100">
              <CardHeader className="bg-slate-50/80 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-700 tracking-wider uppercase">
                  Riwayat Peminjaman
                </CardTitle>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {details.loanHistory.length} Entri
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {details.loanHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                    <BookOpen className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">
                      Belum ada riwayat peminjaman
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {details.loanHistory.map((loan, idx) => {
                      const cfg = loanStatusCfg[loan.status];
                      const StatusIcon = cfg.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {loan.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {loan.date}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.className}`}
                          >
                            <StatusIcon className={`w-3 h-3 ${cfg.iconColor}`} />
                            {cfg.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Notes Card */}
            <Card className="border-l-4 border-l-[#99BD4A] shadow-sm bg-slate-50/80">
              <CardContent className="p-6">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">
                  Catatan Sistem
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#99BD4A] shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Keanggotaan Terdaftar
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {details.joinDate} • 08:00 WIB
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isActive ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        Status:{" "}
                        {isActive ? "Anggota Aktif" : "Anggota Nonaktif"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Terakhir aktif: {details.lastActive}
                      </p>
                    </div>
                  </li>
                  {details.loanHistory.some((l) => l.status === "terlambat") && (
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-600">
                          Riwayat Keterlambatan
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Terdeteksi 1 atau lebih pengembalian terlambat
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <StatusModal
        isOpen={showDeleteConfirm}
        onOpenChange={(open) => { setShowDeleteConfirm(open); if (!open) setDeleteError(""); }}
        status="failed"
        title="Hapus Data Anggota?"
        description={deleteError || `Anda akan menghapus data anggota atas nama "${member.name}" secara permanen. Tindakan ini tidak dapat dibatalkan.`}
        actionLabel={isDeleting ? "Menghapus..." : "Ya, Hapus"}
        cancelLabel="Batal"
        onAction={handleDeleteConfirm}
      />

      {/* Delete Success Modal */}
      <StatusModal
        isOpen={showDeleteSuccess}
        onOpenChange={setShowDeleteSuccess}
        status="success"
        title="Data Anggota Berhasil Dihapus!"
        description="Data anggota telah dihapus dari sistem. Anggota tidak lagi dapat mengakses layanan perpustakaan."
        actionLabel="Kembali ke Daftar"
        onAction={() => router.push("/admin/anggota")}
      />

      {/* Error Modal */}
      <StatusModal
        isOpen={!!errorMsg}
        onOpenChange={(open) => !open && setErrorMsg("")}
        status="failed"
        title="Terjadi Kesalahan"
        description={errorMsg}
        actionLabel="Tutup"
      />
    </div>
  );
}
