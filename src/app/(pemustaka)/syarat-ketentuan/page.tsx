"use client";

import { Shield, BookOpen, Users, AlertTriangle, Scale, FileText } from "lucide-react";

const sections = [
  {
    icon: <BookOpen className="w-5 h-5 text-[#99BD4A]" />,
    title: "1. Ketentuan Umum",
    content: [
      "Sistem ILMS (Intelligent Library Management System) Rumah Kreatif Wadas Kelir adalah platform digital yang menyediakan layanan perpustakaan berbasis teknologi untuk mendukung literasi masyarakat Banyumas.",
      "Dengan mengakses dan menggunakan layanan ini, pengguna dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.",
      "Rumah Kreatif Wadas Kelir berhak mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan terlebih dahulu.",
    ],
  },
  {
    icon: <Users className="w-5 h-5 text-[#99BD4A]" />,
    title: "2. Keanggotaan",
    content: [
      "Untuk menggunakan layanan peminjaman, pengguna wajib terdaftar sebagai anggota perpustakaan Rumah Kreatif Wadas Kelir.",
      "Pendaftaran keanggotaan bersifat gratis dan terbuka untuk semua warga negara Indonesia.",
      "Setiap anggota hanya diperbolehkan memiliki satu (1) akun aktif. Duplikasi akun dapat mengakibatkan pemblokiran.",
      "Anggota wajib menjaga kerahasiaan akun dan kata sandi masing-masing.",
    ],
  },
  {
    icon: <FileText className="w-5 h-5 text-[#99BD4A]" />,
    title: "3. Peminjaman & Pengembalian",
    content: [
      "Setiap anggota dapat meminjam maksimal 3 (tiga) buku dalam waktu bersamaan.",
      "Durasi peminjaman standar adalah 7 (tujuh) hari kalender dan dapat diperpanjang maksimal 1 (satu) kali.",
      "Keterlambatan pengembalian akan dikenakan denda sebesar Rp1.000 per hari per buku.",
      "Buku yang rusak atau hilang selama masa peminjaman menjadi tanggung jawab peminjam dan wajib diganti dengan buku yang sama atau senilai.",
    ],
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-[#99BD4A]" />,
    title: "4. Larangan",
    content: [
      "Pengguna dilarang menggunakan layanan untuk tujuan yang melanggar hukum.",
      "Dilarang merusak, memodifikasi, atau menggandakan koleksi perpustakaan tanpa izin.",
      "Dilarang menggunakan akun orang lain untuk melakukan peminjaman.",
      "Dilarang menyebarkan informasi palsu atau menyesatkan melalui platform ini.",
    ],
  },
  {
    icon: <Scale className="w-5 h-5 text-[#99BD4A]" />,
    title: "5. Hak dan Kewajiban",
    content: [
      "Rumah Kreatif Wadas Kelir berhak menangguhkan atau menghentikan akses pengguna yang melanggar ketentuan.",
      "Pengguna berhak mendapatkan pelayanan yang baik dan informasi yang akurat mengenai koleksi perpustakaan.",
      "Rumah Kreatif Wadas Kelir berkewajiban menjaga keamanan data pengguna sesuai dengan kebijakan privasi yang berlaku.",
      "Seluruh sengketa yang timbul akan diselesaikan secara musyawarah mufakat.",
    ],
  },
];

export default function SyaratKetentuanPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[900px] mx-auto w-full px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-6 h-6 text-[#99BD4A]" />
          <p className="text-[#64748b] text-[12px] font-bold tracking-[0.15em] uppercase">
            Dokumen Legal
          </p>
        </div>
        <h1 className="text-[32px] md:text-[40px] font-extrabold text-[#0F172A] tracking-tight leading-tight mb-3">
          Syarat & Ketentuan
        </h1>
        <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-10">
          Berlaku sejak 1 Januari 2024 — Rumah Kreatif Wadas Kelir, Purwokerto,
          Banyumas.
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
            <span className="font-bold text-[#334155]">Catatan:</span> Dengan
            menggunakan layanan ILMS Rumah Kreatif Wadas Kelir, Anda menyatakan
            telah membaca dan menyetujui seluruh syarat dan ketentuan di atas.
            Untuk pertanyaan lebih lanjut, silakan hubungi kami melalui halaman{" "}
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
