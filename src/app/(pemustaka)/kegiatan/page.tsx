"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useListEventsQuery } from "@/services/events.service";

type MappedEvent = {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  image: string;
  publishDate: string;
  timeInfo: string;
  locationInfo: string;
  content: string[];
};

export default function KegiatanPage() {
  const { data: eventsRes, isLoading } = useListEventsQuery();
  const [kegiatanList, setKegiatanList] = useState<MappedEvent[]>([]);
  const [displayCount, setDisplayCount] = useState(6);
  const [activeTab, setActiveTab] = useState("Semua");

  useEffect(() => {
    if (eventsRes?.data) {
      type ApiEventItem = {
        id?: number | string;
        title?: string;
        event_time?: string;
        event_time_display?: string;
        event_type?: string;
        summary?: string;
        image?: string;
        cover_path?: string;
        cover?: string;
        cover_url?: string;
        created_at?: string;
        location?: string;
        content?: string;
      };

      const rawData = eventsRes.data as { data?: ApiEventItem[]; events?: ApiEventItem[] } | ApiEventItem[];
      let eventsArray: ApiEventItem[] = [];
      if (Array.isArray(rawData)) {
        eventsArray = rawData;
      } else if (rawData && "data" in rawData && Array.isArray(rawData.data)) {
        eventsArray = rawData.data;
      } else if (rawData && "events" in rawData && Array.isArray(rawData.events)) {
        eventsArray = rawData.events;
      }

      const mapped = eventsArray.map((item: ApiEventItem) => {
        const rawImg = item.cover_url || item.image || item.cover_path || item.cover;
        const finalImg = rawImg 
          ? (rawImg.startsWith('http') ? rawImg : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) 
          : `/images/kegiatan-1.jpg`;

        return {
          id: item.id?.toString() || "",
          title: item.title || "Kegiatan Tanpa Judul",
          date: item.event_time_display || (item.event_time ? new Date(item.event_time).toLocaleDateString("id-ID") : "Baru saja"),
          category: item.event_type || "Seni & Budaya",
          description: item.summary || "",
          image: finalImg,
          publishDate: item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "Baru saja",
          timeInfo: item.event_time_display || item.event_time || "",
          locationInfo: item.location || "Aula Wadas Kelir",
          content: item.content ? [item.content] : []
        };
      });
      // Urutkan berdasarkan waktu (terbaru di atas)
      mapped.sort((a, b) => new Date(b.timeInfo).getTime() - new Date(a.timeInfo).getTime());
      setKegiatanList(mapped);
    }
  }, [eventsRes]);

  const categories = ["Semua", ...Array.from(new Set(kegiatanList.map(item => item.category).filter(Boolean)))];

  const filteredList = activeTab === "Semua" ? kegiatanList : kegiatanList.filter(item => item.category === activeTab);
  const displayedList = filteredList.slice(0, displayCount);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FCFDFC]">
      
      {/* Hero Banner Section */}
      <section className="relative w-full h-[320px] md:h-[380px] overflow-hidden flex items-center justify-center bg-[#874b32]">
        {/* CSS Gradient fallback simulating the design's banner */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#385444] via-[#874b32] to-[#426152] opacity-90">
           {/* Abstract shapes for texture */}
           <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#99BD4A]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
           <div className="absolute left-0 bottom-0 w-[400px] h-[400px] bg-black/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        </div>
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <h1 className="text-[44px] md:text-[56px] font-extrabold text-white mb-5 drop-shadow-lg tracking-tight">Kegiatan Kami</h1>
          <p className="text-white/90 text-[16px] md:text-[18px] font-medium leading-relaxed drop-shadow-md">
            Merawat literasi, seni, dan kreativitas bersama masyarakat Banyumas. <br className="hidden md:block"/>
            Menumbuhkan generasi cerdas melalui pemberdayaan komunitas.
          </p>
        </div>
      </section>

      {/* Tabs Filter Bar */}
      {!isLoading && categories.length > 1 && (
        <div className="w-full bg-white shadow-md">
          <div className="max-w-[1200px] mx-auto px-6 py-4 overflow-x-auto">
            <div className="flex items-center justify-start gap-8 min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat);
                    setDisplayCount(6); // Reset pagination saat ganti tab
                  }}
                  className={`px-6 py-2 rounded-xl font-bold text-[14px] transition-colors ${
                    activeTab === cat 
                      ? "bg-[#99BD4A] text-white" 
                      : "bg-transparent text-slate-500 hover:text-[#99BD4A]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid Section */}
      <section className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Memuat kegiatan...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedList.map((item) => (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 border border-slate-100 flex flex-col group">
              
              {/* Card Image */}
              <div className="relative w-full aspect-[16/10] bg-slate-800 overflow-hidden">
                 {/* Fallback pattern */}
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <span className="text-slate-500 text-xs font-bold px-4 text-center">{item.title}</span>
                 </div>
                 
                 {/* Next Image */}
                 <Image 
                   src={item.image}
                   alt={item.title}
                   fill
                   className="object-cover relative z-10 group-hover:scale-105 transition-transform duration-500"
                   onError={(e) => {
                      e.currentTarget.style.display = 'none';
                   }}
                 />
                 
                 {/* Category Badge overlay */}
                 <div className="absolute top-4 left-4 z-20">
                   <span className="bg-[#99BD4A] text-white text-[10px] font-extrabold px-3 py-1.5 rounded uppercase tracking-wider shadow-sm">
                     {item.category}
                   </span>
                 </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                <span className="text-[#94a3b8] text-[13px] font-medium mb-3 block">
                  {item.date}
                </span>
                <h3 className="font-extrabold text-[#1e293b] text-[18px] leading-snug mb-3 group-hover:text-[#99BD4A] transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-[14px] leading-relaxed line-clamp-3 mb-6">
                  {item.description}
                </p>
                
                {/* Action Link */}
                <div className="mt-auto">
                  <Link href={`/kegiatan/${item.id}`} className="inline-flex items-center text-[#99BD4A] font-bold text-[14px] hover:text-[#82a33c] transition-colors group/link">
                    Baca Selengkapnya
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
        )}

        {!isLoading && kegiatanList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500 font-medium">Belum ada kegiatan yang tersedia.</p>
          </div>
        ) : !isLoading && displayedList.length === 0 && (
          <div className="w-full py-16 text-center">
            <p className="text-slate-500 font-medium text-[16px]">Belum ada kegiatan untuk kategori ini.</p>
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && filteredList.length > displayCount && (
            <div className="mt-14 flex justify-center">
            <button 
              onClick={() => setDisplayCount(prev => prev + 6)}
              className="border-2 border-[#99BD4A] text-[#8ca846] hover:bg-[#99BD4A] hover:text-white px-8 py-2.5 rounded-[10px] font-bold text-[15px] transition-colors shadow-sm"
            >
              Muat Lebih Banyak
            </button>
          </div>
        )}

      </section>

    </div>
  );
}
