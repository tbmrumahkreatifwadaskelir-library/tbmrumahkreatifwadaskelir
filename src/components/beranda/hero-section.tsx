"use client";

import { useState, useEffect } from "react";
import berandaData from "@/json/beranda.json";
import { useMemberDashboardQuery } from "@/services/dashboard.service";
import { useSession } from "next-auth/react";

export default function HeroSection() {
  const { data: dashboardRes } = useMemberDashboardQuery();
  const { data: session } = useSession();
  const [hero, setHero] = useState(berandaData.hero);

  const getGreetingByTime = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  useEffect(() => {
    const localGreeting = getGreetingByTime();
    if (dashboardRes?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = dashboardRes.data as any;
      setHero((prev) => {
        const isGreetingObj = typeof data.greeting === 'object' && data.greeting !== null;
        
        return {
          ...prev,
          userName: session?.user?.name || data.user?.name || (isGreetingObj ? data.greeting.name : undefined) || prev.userName,
          greeting: localGreeting,
          title: data.title || prev.title,
          subtitle: data.subtitle || (isGreetingObj ? data.greeting.subtitle : undefined) || prev.subtitle,
        };
      });
    } else if (session?.user?.name) {
      setHero((prev) => ({
        ...prev,
        userName: session.user.name,
        greeting: localGreeting,
      }));
    } else {
      // Update greeting even if not logged in
      setHero((prev) => ({
        ...prev,
        greeting: localGreeting,
      }));
    }
  }, [dashboardRes, session]);

  const { userName, greeting, title, subtitle } = hero;

  return (
    <section className="px-6 lg:px-10 pt-10 pb-6 max-w-[1440px] mx-auto">
      <h1 className="text-3xl md:text-[40px] font-extrabold text-[#1e293b] leading-tight tracking-tight">
        {greeting}{" "}
        <span className="text-[#99BD4A]">{userName}</span>
        , {title}
      </h1>
      <p className="mt-3 text-slate-500 text-base md:text-[15px] leading-relaxed max-w-2xl">
        {subtitle}
      </p>
    </section>
  );
}
