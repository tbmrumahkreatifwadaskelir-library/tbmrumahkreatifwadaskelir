"use client";

import { useState, useEffect } from "react";
import { X, Book, Sparkles, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
);

export default function SplashScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("hasSeenSplash", "true");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!mounted) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 md:p-4 animate-in fade-in duration-300">
      {/* Container */}
      <div className="relative flex flex-col md:flex-row w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-[850px] bg-slate-50 md:rounded-3xl overflow-y-auto overflow-x-hidden md:overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        {/* Left Section (Green) */}
        <div className="relative flex-shrink-0 flex flex-col items-center justify-center w-full md:w-[42%] bg-[#99BD4A] text-white p-6 md:p-8 min-h-[400px] md:min-h-[auto] overflow-hidden">
          {/* Background decorative circles */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center text-center w-full">
            {/* Logo area */}
            <div className="w-28 h-28 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mb-6">
              <Image src="/favicon.png" alt="Logo" width={80} height={80} />
            </div>

            <h2 className="text-[28px] font-serif font-bold leading-tight tracking-wide mb-5">
              TBM
            </h2>
            <p className="text-[10px] tracking-[0.2em] text-white/80 mb-10 font-medium uppercase">
              RKWK
            </p>

            {/* Chart.js Decorative */}
            <div className="w-[85%] h-28 mb-4 bg-white/20 backdrop-blur-sm border border-white/30 p-3 rounded-2xl shadow-lg relative z-10 flex flex-col">
              <div className="h-full w-full">
                <Bar 
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep'],
                    datasets: [
                      {
                        data: [50, 35, 75, 40, 60, 45, 65, 90, 55],
                        backgroundColor: [
                          '#FFFFFF', '#e8d77c', '#6fb3eb', '#FFFFFF', '#FFFFFF',
                          '#e28cb4', '#6fb3eb', '#c293e5', '#eb9d6b'
                        ],
                        borderRadius: 4,
                        barPercentage: 0.7,
                        borderSkipped: false,
                      }
                    ]
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { 
                        enabled: true,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 8,
                        displayColors: false,
                        callbacks: {
                          label: function(context) {
                            return context.raw + ' buku dipinjam';
                          }
                        }
                      },
                    },
                    scales: {
                      x: { display: false, grid: { display: false } },
                      y: { display: false, grid: { display: false }, beginAtZero: true, max: 100 },
                    },
                    layout: { padding: 0 }
                  }} 
                />
              </div>
            </div>

            <p className="text-[10px] text-white/70 mt-6 mb-1 uppercase tracking-widest font-semibold">
              Total Koleksi
            </p>
            <h3 className="text-5xl font-serif font-bold tracking-wide">
              1.200+
            </h3>
            <p className="text-sm text-white/80 mt-1 font-medium">
              judul buku tersedia
            </p>
          </div>
        </div>

        {/* Right Section (White) */}
        <div className="relative flex flex-col w-full md:w-[58%] p-6 md:p-8 bg-[#f8fafc]">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-gray-200 transition-colors bg-white shadow-sm border border-gray-100 z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-6 mt-4 md:mt-0">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100/80 text-green-700 text-[11px] font-bold tracking-wide rounded-full border border-green-200/50 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Selamat Datang
            </span>
            <span className="px-3 py-1 bg-orange-100/80 text-orange-700 text-[11px] font-bold tracking-wide rounded-full border border-orange-200/50 uppercase">
              ILMS 2026
            </span>
          </div>

          <h1 className="text-[26px] md:text-[28px] font-serif font-bold text-gray-800 leading-[1.15] mb-3">
            Jelajahi Dunia
            <br />
            <span className="text-[#99BD4A]">Literasi Digital</span>
            <br />
            Rumah Kreatif Wadas Kelir
          </h1>

          <p className="text-[13px] md:text-[14px] text-gray-500 mb-5 leading-relaxed pr-4">
            Sistem manajemen Taman Bacaan Masyarakat (TBM) modern untuk mendukung operasional dan
            aksesibilitas buku di Rumah Kreatif Wadas Kelir. Pinjam, baca, dan
            berkembang bersama.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex-shrink-0 w-9 h-9 bg-[#99BD4A] rounded-xl flex items-center justify-center">
                <Book className="w-4 h-4 text-white/90" />
              </div>
              <p className="text-[12px] font-medium text-gray-600 leading-snug">
                Katalog digital
                <br />
                lengkap
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex-shrink-0 w-9 h-9 bg-[#99BD4A] rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white/90" />
              </div>
              <p className="text-[12px] font-medium text-gray-600 leading-snug">
                Rekomendasi AI
                <br />
                cerdas
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex-shrink-0 w-9 h-9 bg-[#99BD4A] rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-white/90" />
              </div>
              <p className="text-[12px] font-medium text-gray-600 leading-snug">
                Pantau jadwal
                <br />
                pinjaman
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex-shrink-0 w-9 h-9 bg-[#99BD4A] rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white/90" />
              </div>
              <p className="text-[12px] font-medium text-gray-600 leading-snug">
                Info kegiatan
                <br />
                literasi
              </p>
            </div>
          </div>

          {/* Info Buka */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-[#f4f7ee] to-[#f4f7ee]/60 p-3 rounded-2xl border border-[#99BD4A]/20 mb-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <div className="bg-[#99BD4A] text-white p-2 rounded-xl shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-800">Jam Operasional</p>
                <p className="text-[10px] font-bold text-[#99BD4A] uppercase tracking-wide">Senin - Jumat</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm w-full sm:w-auto justify-center">
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Sesi 1</p>
                <p className="text-[12px] font-bold">07.00 - 11.00</p>
              </div>
              <div className="w-[1px] h-6 bg-gray-200"></div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Sesi 2</p>
                <p className="text-[12px] font-bold">14.00 - 16.00</p>
              </div>
            </div>
          </div>

          <div className="mt-auto w-full flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/login?view=register"
              onClick={handleClose}
              className="flex-1 flex items-center justify-center text-center w-full px-5 py-3 rounded-xl font-bold text-white bg-[#99BD4A] shadow-[0_8px_30px_rgba(153,189,74,0.3)] border border-[#99BD4A] hover:bg-[#89a843] transition-all active:scale-[0.98]"
            >
              Daftar sebagai anggota
            </Link>
            <button
              onClick={handleClose}
              className="flex-1 flex items-center justify-center w-full px-5 py-3 sm:py-6 rounded-xl font-bold text-gray-500 bg-transparent border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
