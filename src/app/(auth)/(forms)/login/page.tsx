"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  Globe,
} from "lucide-react";

import {
  useRegisterMutation,
} from "@/services/auth.service";
import { ApiError } from "@/lib/error-utils";

import { ForgotPasswordView } from "./forgot-password";
import { RegisterView, type RegisterFormData } from "./register-view";
import { ReactivateView } from "./reactivate-view";

type ViewState = "login" | "register" | "forgot_password" | "reactivate";

export default function AuthPage() {
  const router = useRouter();

  const [view, setView] = useState<ViewState>("login");
  const [registerStep, setRegisterStep] = useState(1);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "register") {
        setView("register");
        const stepParam = params.get("step");
        if (stepParam) {
          setRegisterStep(parseInt(stepParam, 10));
        }
      } else if (params.get("view") === "reactivate") {
        setView("reactivate");
      }
    }
  }, []);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [registerApi] = useRegisterMutation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    setIsLoading(false);

    if (res?.ok) {
      // Ambil session untuk mendapatkan role, lalu redirect sesuai role
      const session = await getSession();
      const role = session?.user?.role;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const verificationStatus = (session?.user as any)?.member?.verification_status;
      const userStatus = session?.user?.status;

      if (role === "admin") {
        router.push("/admin");
      } else {
        if (verificationStatus === "pending" || userStatus === "inactive") {
          router.replace("/login?view=register&step=3");
        } else {
          router.push("/");
        }
      }
    } else {
      setError(res?.error || "Email atau password salah.");
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("password_confirmation", data.password_confirmation);
      formData.append("nik_nisn", data.nik_nisn);
      formData.append("id_type", data.id_type);
      formData.append("phone", data.phone);
      formData.append("address", data.address);
      formData.append("birth_date", data.birth_date);
      if (data.identity_doc) {
        formData.append("identity_doc", data.identity_doc);
      }
      // Wali wajib untuk anak usia < 17 tahun
      if (data.guardian_name) formData.append("guardian_name", data.guardian_name);
      if (data.guardian_nik) formData.append("guardian_nik", data.guardian_nik);
      if (data.guardian_phone) formData.append("guardian_phone", data.guardian_phone);

      await registerApi(formData).unwrap();
      setSuccessMsg("Registrasi berhasil! Berkas sedang diverifikasi.");
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as ApiError;
      setError(apiErr?.data?.message || "Gagal melakukan registrasi.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };



  const switchView = (v: ViewState) => {
    setView(v);
    setError("");
    setSuccessMsg("");
  };

  // Illustrations
  const LoginIllustration = () => (
    <div className="hidden lg:flex w-1/2 bg-[#9ABE4B]/20 flex-col items-center justify-center p-12 relative min-h-screen">
      <div className="flex-1 flex flex-col items-center gap-y-6 justify-center text-center w-full">
        {/* Container utama dibatasi ukurannya sesuai lebar gambar agar label ikut menyesuaikan */}
        <div className="w-[400px] flex flex-col gap-4">
          {/* Div Taman Baca - Sekarang lebarnya akan mengikuti parent (400px) */}
          <div className="flex items-center justify-center gap-3 bg-white px-5 py-4 rounded-xl shadow-sm text-slate-800 w-full">
            <Image
              src="/icons/icon-ilms-no-fill.png"
              alt="Logo"
              width={32}
              height={32}
            />
            <span className="font-extrabold text-[#1f2937] text-xl">
              Taman Baca Masyarakat (TBM)
            </span>
          </div>

          {/* Div Gambar */}
          <div className="w-full shadow-md aspect-[6/7] bg-[#faecd5] rounded-3xl flex items-center justify-center overflow-hidden relative">
            <Image
              src="/images/image-login.png"
              alt="Illustration"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Quote */}
        <p className="text-[#374151] font-bold text-lg max-w-[400px] leading-relaxed antialiased">
          {`"Literasi adalah jembatan menuju mimpi yang tak terbatas."`}
        </p>
      </div>
    </div>
  );

  /* ─── RENDER ───────────────────────────────────────────────────────── */

  // FORGOT PASSWORD VIEW
  if (view === "forgot_password") {
    return (
      <ForgotPasswordView
        onBackToLogin={() => switchView("login")}
      />
    );
  }

  // REGISTER VIEW
  if (view === "register") {
    return (
      <RegisterView
        initialStep={registerStep}
        onBackToLogin={() => switchView("login")}
        onRegisterSubmit={handleRegisterSubmit}
        isLoading={isLoading}
        error={error}
        successMsg={successMsg}
        setError={setError}
        setSuccessMsg={setSuccessMsg}
      />
    );
  }

  // REACTIVATE VIEW
  if (view === "reactivate") {
    return (
      <ReactivateView
        onBackToLogin={() => switchView("login")}
      />
    );
  }

  // LOGIN VIEW
  return (
    <div className="h-screen w-full flex bg-white font-sans text-slate-900 overflow-x-hidden">
      <LoginIllustration />
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-24 relative min-h-screen">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-left">
            <h1 className="text-[34px] font-extrabold text-[#1e293b] mb-3 tracking-tight">
              Selamat Datang Kembali
            </h1>
            <p className="text-slate-500 text-[15px] font-medium leading-relaxed pr-6">
              Masuk untuk melanjutkan petualangan literasimu di perpustakaan
              kami.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-bold text-[13px] text-slate-700"
              >
                Email atau Username
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-[18px] w-[18px]" />
                </div>
                <Input
                  id="email"
                  type="text"
                  placeholder="Masukkan email atau username anda"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-[44px] py-[22px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-bold text-[13px] text-slate-700"
              >
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-[18px] w-[18px]" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password anda"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-[44px] pr-12 py-[22px] bg-[#f8fafc] border-slate-200 rounded-xl focus-visible:ring-[#9ABE4B] text-[14px] font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  className="border-slate-300 rounded data-[state=checked]:bg-[#9ABE4B] data-[state=checked]:border-[#9ABE4B] focus:ring-[#9ABE4B] focus-visible:ring-[#9ABE4B] w-[18px] h-[18px]"
                />
                <label
                  htmlFor="remember"
                  className="text-[13px] font-bold text-slate-600 cursor-pointer"
                >
                  Ingat Saya
                </label>
              </div>
              <button
                type="button"
                onClick={() => switchView("forgot_password")}
                className="text-[13px] font-bold text-[#9ABE4B] hover:text-[#89A843]"
              >
                Lupa Password?
              </button>
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-red-500 font-medium">{error}</p>
                {(error.toLowerCase().includes("ditangguhkan") || 
                  error.toLowerCase().includes("tidak aktif") || 
                  error.toLowerCase().includes("diblokir")) && (
                  <button
                    type="button"
                    onClick={() => switchView("reactivate")}
                    className="text-[13px] font-bold text-[#9ABE4B] hover:text-[#89A843] block mt-1"
                  >
                    Ajukan reaktivasi akun Anda di sini
                  </button>
                )}
              </div>
            )}
            {successMsg && (
              <p className="text-sm text-green-500 font-medium">{successMsg}</p>
            )}

            <Button
              type="submit"
              className="w-full mt-2 py-[24px] rounded-xl bg-[#9ABE4B] hover:bg-[#89A843] text-white font-bold text-[15px] transition-colors duration-200 shadow-md shadow-[#9ABE4B]/20"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Masuk ke Akun"}
            </Button>

            <div className="text-center text-[14px] text-slate-500 mt-8 mb-4">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => switchView("register")}
                className="font-bold text-[#9ABE4B] hover:text-[#89A843]"
              >
                Daftar sekarang
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-10 flex justify-center items-center gap-8 text-[13px] text-slate-500 font-bold">
            <a
              href="/kontak"
              className="flex items-center gap-2 hover:text-[#9ABE4B] transition-colors"
            >
              <HelpCircle className="w-[18px] h-[18px]" /> Bantuan
            </a>
            <a
              href="#"
              className="flex items-center gap-2 hover:text-[#9ABE4B] transition-colors"
            >
              <Globe className="w-[18px] h-[18px]" /> Bahasa Indonesia
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
