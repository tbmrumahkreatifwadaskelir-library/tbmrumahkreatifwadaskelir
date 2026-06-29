"use client";

import { Lock, Database, Eye, Shield, UserCheck, Settings } from "lucide-react";

const sections = [
  {
    icon: <Database className="w-5 h-5 text-[#99BD4A]" />,
    title: "1. Data yang Kami Kumpulkan",
    content: [
      "Informasi pribadi: Nama lengkap, alamat email, nomor WhatsApp, alamat tempat tinggal, dan foto profil.",
      "Informasi keanggotaan: ID Anggota, tanggal pendaftaran, dan riwayat aktivitas peminjaman.",
      "Data teknis: Alamat IP, jenis perangkat, jenis browser, dan waktu akses untuk keperluan keamanan sistem.",
      "Data interaksi: Komentar, ulasan buku, dan aktivitas partisipasi kegiatan.",
    ],
  },
  {
    icon: <Eye className="w-5 h-5 text-[#99BD4A]" />,
    title: "2. Penggunaan Data",
    content: [
      "Memproses dan mengelola peminjaman serta pengembalian buku secara efisien.",
      "Mengirimkan notifikasi terkait layanan perpustakaan, seperti pengingat pengembalian dan informasi kegiatan.",
      "Meningkatkan kualitas layanan dan pengalaman pengguna melalui analisis data anonim.",
      "Memenuhi kewajiban hukum dan regulasi yang berlaku di Indonesia.",
    ],
  },
  {
    icon: <Shield className="w-5 h-5 text-[#99BD4A]" />,
    title: "3. Perlindungan Data",
    content: [
      "Kami menggunakan enkripsi SSL/TLS untuk melindungi transmisi data antara perangkat Anda dan server kami.",
      "Kata sandi pengguna disimpan dalam bentuk hash dan tidak pernah disimpan dalam teks biasa (plain text).",
      "Akses terhadap data pribadi dibatasi hanya untuk staf yang berwenang dengan otentikasi multi-faktor.",
      "Kami melakukan audit keamanan secara berkala untuk memastikan integritas dan keamanan data.",
    ],
  },
  {
    icon: <UserCheck className="w-5 h-5 text-[#99BD4A]" />,
    title: "4. Hak Pengguna",
    content: [
      "Anda berhak mengakses, memperbarui, atau mengoreksi data pribadi Anda kapan saja melalui halaman profil.",
      "Anda berhak meminta penghapusan akun dan seluruh data pribadi yang terkait.",
      "Anda berhak menolak penggunaan data untuk tujuan pemasaran atau komunikasi non-esensial.",
      "Anda berhak mengajukan keluhan terkait pengelolaan data melalui kontak resmi kami.",
    ],
  },
  {
    icon: <Settings className="w-5 h-5 text-[#99BD4A]" />,
    title: "5. Cookies & Teknologi Pelacakan",
    content: [
      "Kami menggunakan cookies untuk menjaga sesi login dan preferensi tampilan Anda.",
      "Cookies analitik digunakan untuk memahami pola penggunaan secara anonim guna peningkatan layanan.",
      "Anda dapat mengatur preferensi cookies melalui pengaturan browser Anda.",
      "Menonaktifkan cookies tertentu dapat memengaruhi fungsionalitas beberapa fitur di platform ini.",
    ],
  },
];

export default function KebijakanPrivasiPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[900px] mx-auto w-full px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Lock className="w-6 h-6 text-[#99BD4A]" />
          <p className="text-[#64748b] text-[12px] font-bold tracking-[0.15em] uppercase">
            Dokumen Legal
          </p>
        </div>
        <h1 className="text-[32px] md:text-[40px] font-extrabold text-[#0F172A] tracking-tight leading-tight mb-3">
          Kebijakan Privasi
        </h1>
        <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-10">
          Terakhir diperbarui: 1 Januari 2024 — Rumah Kreatif Wadas Kelir
          berkomitmen melindungi privasi data Anda.
        </p>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7"
            >
              <div className="flex items-center gap-3 mb-4">
                {section.icon}
                <h2 className="text-[18px] font-extrabold text-[#0F172A]">
                  {section.title}
                </h2>
              </div>
              <ul className="flex flex-col gap-3">
                {section.content.map((item, i) => (
                  <li
                    key={i}
                    className="text-[14px] text-[#475569] leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-2 before:h-2 before:bg-[#99BD4A]/30 before:rounded-full"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 p-6 bg-[#f4f7ee] rounded-2xl border border-[#99BD4A]/20">
          <p className="text-[13px] text-[#64748b] leading-relaxed">
            <span className="font-bold text-[#334155]">Catatan:</span> Kebijakan
            privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan
            diinformasikan melalui notifikasi di platform. Jika Anda memiliki
            pertanyaan mengenai kebijakan ini, silakan hubungi kami melalui
            halaman{" "}
            <a href="/kontak" className="text-[#99BD4A] font-bold hover:underline">
              Kontak Kami
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
