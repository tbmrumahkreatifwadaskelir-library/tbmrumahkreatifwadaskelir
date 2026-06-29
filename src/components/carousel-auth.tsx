"use client";

import * as React from "react";
import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export function CarouselAuth() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // ⬇️ Autoplay tiap 5 detik
  React.useEffect(() => {
    if (!api) return;

    const id = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(id);
  }, [api]);

  const items = [
    {
      title: "Streamline Operations,\nMaximize Efficiency",
      image: "/images/carousel1.png",
    },
    {
      title: "Real-Time Insights,\nSmarter Decisions",
      image: "/images/carousel2.png",
    },
    {
      title: "Empower Your Business\nfor Future Growth",
      image: "/images/carousel3.png",
    },
  ];

  return (
    <div className="w-full h-full relative">
      <Carousel setApi={setApi} className="w-full h-full">
        <CarouselContent className="h-full">
          {items.map((item, index) => (
            <CarouselItem key={index} className="relative min-h-screen">
              <Image
                src={item.image}
                alt={`Slide ${index + 1}`}
                fill
                priority
                className="object-cover"
              />
              {/* Overlay teks */}
              <div className="absolute inset-0 flex items-end justify-center">
                <div className="text-white text-center p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent w-full">
                  <h2 className="text-2xl md:text-3xl font-semibold whitespace-pre-line">
                    {item.title}
                  </h2>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Tombol Navigasi */}
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />

        {/* Bulatan indikator */}
        <div className="absolute bottom-6 w-full flex justify-center gap-2">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className={`transition-all duration-300 ${
                current === index
                  ? "w-6 h-2 rounded-full bg-white"
                  : "w-2 h-2 rounded-full bg-white/50"
              }`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
