"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetDigitalStreamUrlMutation } from "@/services/loans.service";
import { ArrowLeft, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [getStreamUrl, { isLoading }] = useGetDigitalStreamUrlMutation();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg("Token tidak valid.");
      return;
    }

    const fetchUrl = async () => {
      try {
        const res = await getStreamUrl(token).unwrap();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const url = (res.data as any)?.stream_url;
        if (url) {
          setStreamUrl(url);
        } else {
          setErrorMsg("Gagal memuat dokumen digital.");
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setErrorMsg(err?.data?.message || "Token tidak valid atau akses telah kedaluwarsa.");
      }
    };

    fetchUrl();
  }, [token, getStreamUrl]);

  if (isLoading || (!streamUrl && !errorMsg)) {
    return (
      <div className="fixed top-16 left-0 right-0 bottom-0 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center z-[90]">
        <div className="w-16 h-16 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-[20px] font-bold text-[#1e293b]">Mempersiapkan Dokumen...</h2>
        <p className="text-[#64748b] mt-2">Harap tunggu sebentar, kami sedang memuat buku Anda.</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="fixed top-16 left-0 right-0 bottom-0 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center z-[90]">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-[24px] font-extrabold text-[#1e293b] mb-2">Akses Ditolak</h1>
        <p className="text-[#64748b] mb-8 max-w-md">{errorMsg}</p>
        <Button 
          onClick={() => router.back()} 
          className="bg-[#1e293b] hover:bg-[#334155] text-white px-8 h-12 rounded-xl font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 bg-[#1E293B] flex flex-col overflow-hidden z-[90]">
      {/* Top Navbar overlay */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center px-4 md:px-6 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold text-[14px]">Kembali</span>
        </button>
        <div className="mx-auto flex items-center gap-2 text-white/80 select-none">
          <BookOpen className="w-4 h-4" />
          <span className="text-[14px] font-medium tracking-wide">ILMS Digital Reader</span>
        </div>
        <div className="w-[100px]" /> {/* Spacer for centering */}
      </div>

      {/* PDF Iframe */}
      <div className="flex-1 w-full h-full relative">
        <iframe
          src={`${streamUrl}#toolbar=0&navpanes=0`}
          className="absolute inset-0 w-full h-full border-none bg-white"
          title="Digital Reader"
          allowFullScreen
        />
      </div>
    </div>
  );
}
