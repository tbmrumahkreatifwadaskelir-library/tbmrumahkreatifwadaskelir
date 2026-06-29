"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { StatusModal } from "@/components/ui/status-modal";

const contactInfo = [
  {
    icon: <MapPin className="w-5 h-5 text-[#99BD4A]" />,
    label: "Alamat",
    value:
      "Jl. Wadas Kelir, Rt. 07/Rw. 05, Windusara, Karangklesem, Kec. Purwokerto Sel, Kab. Banyumas",
  },
  {
    icon: <Phone className="w-5 h-5 text-[#99BD4A]" />,
    label: "Telepon",
    value: "+62 857 4156 2265",
  },
  {
    icon: <Mail className="w-5 h-5 text-[#99BD4A]" />,
    label: "Email",
    value: "rumahkreatifwadaskelir@gmail.com",
  },
  {
    icon: <Clock className="w-5 h-5 text-[#99BD4A]" />,
    label: "Jam Operasional",
    value: "Senin-jumat: \n07.00-11.00\ndan\n14.00-16.00",
  },
];

const socialLinks = [
  {
    icon: <Instagram className="w-5 h-5" />,
    label: "Instagram",
    handle: "@rumahkreatifwadaskelir",
    url: "https://www.instagram.com/rumahkreatifwadaskelir/",
  },
  {
    icon: <Facebook className="w-5 h-5" />,
    label: "Facebook",
    handle: "Rumah Kreatif Wadas Kelir",
    url: "https://www.facebook.com/groups/477568092320740/?locale=id_ID",
  },
  {
    icon: <Youtube className="w-5 h-5" />,
    label: "YouTube",
    handle: "Wadas Kelir Channel",
    url: "https://www.youtube.com/@rumahkreatifwadaskelir9524",
  },
];

export default function KontakPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static - just show success modal
    setIsSuccessOpen(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1100px] mx-auto w-full px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MessageSquare className="w-6 h-6 text-[#99BD4A]" />
            <p className="text-[#64748b] text-[12px] font-bold tracking-[0.15em] uppercase">
              Hubungi Kami
            </p>
          </div>
          <h1 className="text-[32px] md:text-[40px] font-extrabold text-[#0F172A] tracking-tight leading-tight mb-3">
            Kontak Kami
          </h1>
          <p className="text-[#64748b] text-[15px] font-medium leading-relaxed max-w-[600px] mx-auto">
            Kami siap membantu Anda. Kirimkan pertanyaan, saran, atau masukan
            melalui formulir di bawah ini atau kunjungi kami langsung.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Contact Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Info Cards */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-[17px] font-extrabold text-[#0F172A] mb-5">
                Informasi Kontak
              </h3>
              <div className="flex flex-col gap-5">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f4f7ee] flex items-center justify-center shrink-0 mt-0.5">
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-[#99BD4A] text-[11px] font-bold tracking-[0.12em] uppercase mb-0.5">
                        {info.label}
                      </p>
                      <p className="text-[#1e293b] text-[14px] font-semibold leading-relaxed whitespace-pre-line">
                        {info.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-[17px] font-extrabold text-[#0F172A] mb-5">
                Media Sosial
              </h3>
              <div className="flex flex-col gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f4f7ee] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#f4f7ee] group-hover:bg-[#99BD4A] flex items-center justify-center shrink-0 text-[#99BD4A] group-hover:text-white transition-colors">
                      {social.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#334155]">
                        {social.label}
                      </p>
                      <p className="text-[12px] text-[#94a3b8] font-medium">
                        {social.handle}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <h3 className="text-[17px] font-extrabold text-[#0F172A] mb-2">
                Kirim Pesan
              </h3>
              <p className="text-[#64748b] text-[13px] font-medium mb-6">
                Isi formulir di bawah ini dan kami akan merespons secepatnya.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-[#1e293b] font-medium outline-none focus:ring-2 focus:ring-[#99BD4A]/30 focus:border-[#99BD4A] transition-all placeholder:text-[#c1c7cd]"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-[#1e293b] font-medium outline-none focus:ring-2 focus:ring-[#99BD4A]/30 focus:border-[#99BD4A] transition-all placeholder:text-[#c1c7cd]"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                    Subjek
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-[#1e293b] font-medium outline-none focus:ring-2 focus:ring-[#99BD4A]/30 focus:border-[#99BD4A] transition-all placeholder:text-[#c1c7cd]"
                    placeholder="Topik pesan Anda"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-[13px] font-semibold text-[#334155] block mb-2">
                    Pesan
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-[#1e293b] font-medium outline-none focus:ring-2 focus:ring-[#99BD4A]/30 focus:border-[#99BD4A] transition-all resize-none placeholder:text-[#c1c7cd]"
                    placeholder="Tulis pesan Anda di sini..."
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full bg-[#99BD4A] hover:bg-[#87A840] text-white py-3.5 rounded-xl font-bold text-[14px] transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map Embed Placeholder */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="text-[17px] font-extrabold text-[#0F172A]">
              Lokasi Kami
            </h3>
            <p className="text-[#64748b] text-[13px] font-medium mt-1">
              Rumah Kreatif Wadas Kelir, Purwokerto Selatan, Banyumas
            </p>
          </div>
          <div className="w-full h-[300px] bg-slate-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.107363478036!2d109.23312049678955!3d-7.453373299999992!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e655d6a69756471%3A0x6d856570e72118e5!2sRKWK!5e0!3m2!1sid!2sid!4v1778081996914!5m2!1sid!2sid"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <StatusModal
        isOpen={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        status="success"
        title={
          <>
            Pesan Berhasil
            <br />
            Terkirim!
          </>
        }
        description="Terima kasih telah menghubungi kami. Tim kami akan merespons pesan Anda dalam waktu 1x24 jam kerja."
        actionLabel="Tutup"
        onAction={() => setIsSuccessOpen(false)}
      />
    </div>
  );
}
