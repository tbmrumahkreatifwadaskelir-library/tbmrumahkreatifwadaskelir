"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useListEventsQuery } from "@/services/events.service";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Loader2, Calendar } from "lucide-react";

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

export default function EventCarousel() {
  const { data: eventsRes, isLoading } = useListEventsQuery();
  const [kegiatanList, setKegiatanList] = useState<MappedEvent[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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
          date: item.event_time_display || (item.event_time ? new Date(item.event_time).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "Baru saja"),
          category: item.event_type || "Kegiatan",
          description: item.summary || "",
          image: finalImg,
          publishDate: item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "Baru saja",
          timeInfo: item.event_time_display || item.event_time || "",
          locationInfo: item.location || "",
          content: item.content ? [item.content] : []
        };
      });
      // Sort by newest based on timeInfo or created_at
      mapped.sort((a, b) => new Date(b.timeInfo || b.publishDate).getTime() - new Date(a.timeInfo || a.publishDate).getTime());
      
      // Get only the last 5 data
      setKegiatanList(mapped.slice(0, 5));
    }
  }, [eventsRes]);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000); // Auto-play every 5 seconds

    return () => clearInterval(interval);
  }, [api]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-100/50 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-[#99BD4A]" />
      </div>
    );
  }

  if (!kegiatanList || kegiatanList.length === 0) {
    return null; // Do not display if there are no events
  }

  return (
    <section className="w-full relative bg-slate-900 group">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {kegiatanList.map((event) => (
            <CarouselItem key={event.id} className="pl-0">
              <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
                {/* Background Image */}
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover object-center"
                  priority
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-[1440px] mx-auto w-full">
                  <div className="flex flex-col items-start gap-4 max-w-3xl">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#99BD4A] text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                        {event.category}
                      </span>
                      <span className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </span>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                      {event.title}
                    </h2>
                    
                    <p className="text-white/80 text-sm md:text-base line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl hidden md:block">
                      {event.description}
                    </p>

                    <Link 
                      href={`/kegiatan/${event.id}`}
                      className="mt-2 bg-white text-slate-900 hover:bg-[#99BD4A] hover:text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-lg inline-flex items-center gap-2 group/btn"
                    >
                      Lihat Selengkapnya
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Buttons */}
        <div className="absolute bottom-6 right-6 md:right-12 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <CarouselPrevious className="relative inset-0 translate-x-0 translate-y-0 h-10 w-10 bg-white/20 hover:bg-white text-white hover:text-slate-900 border-none backdrop-blur-sm" />
          <CarouselNext className="relative inset-0 translate-x-0 translate-y-0 h-10 w-10 bg-white/20 hover:bg-white text-white hover:text-slate-900 border-none backdrop-blur-sm" />
        </div>
      </Carousel>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {kegiatanList.map((_, index) => (
          <button
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              current === index ? "w-8 bg-[#99BD4A]" : "w-4 bg-white/40"
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
