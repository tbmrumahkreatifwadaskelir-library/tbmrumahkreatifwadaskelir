"use client";

import * as React from "react";
import {
  IconLayoutGrid,
  IconBook,
  IconUsers,
  IconClipboardList,
  IconChartBar,
  IconSettings,
  IconActivityHeartbeat,
  IconCalendarEvent,
  IconCash,
  IconBookUpload,
  IconTag,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";

const NAV_DATA = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconLayoutGrid,
    },
    {
      title: "Manajemen Buku",
      url: "/admin/buku",
      icon: IconBook,
    },
    {
      title: "Master Kategori",
      url: "/admin/kategori",
      icon: IconTag,
    },
    {
      title: "Manajemen Anggota",
      url: "/admin/anggota",
      icon: IconUsers,
    },
    {
      title: "Permintaan Pinjam",
      url: "/admin/permintaan",
      icon: IconClipboardList,
    },
    {
      title: "Kelola Peminjaman",
      url: "/admin/peminjaman",
      icon: IconBookUpload,
    },
    {
      title: "Manajemen Denda",
      url: "/admin/denda",
      icon: IconCash,
    },
    {
      title: "Manajemen Kegiatan",
      url: "/admin/kegiatan",
      icon: IconCalendarEvent,
    },
    {
      title: "Log Aktivitas",
      url: "/admin/anggota/log",
      icon: IconActivityHeartbeat,
    },
  ],
  navSecondary: [
    {
      title: "Analitik",
      url: "/admin/analitik",
      icon: IconChartBar,
    },
    {
      title: "Pengaturan",
      url: "/admin/pengaturan",
      icon: IconSettings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extUser = (session?.user as any);
  let rawSidebarAvatar = extUser?.avatar_url || session?.user?.image || "/icon-marketing.png";
  if (rawSidebarAvatar && rawSidebarAvatar !== "/icon-marketing.png" && !rawSidebarAvatar.startsWith('http') && !rawSidebarAvatar.startsWith('/images') && !rawSidebarAvatar.startsWith('data:')) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
    rawSidebarAvatar = `${baseUrl}/${rawSidebarAvatar.replace(/^\//, '')}`;
  }

  const userData = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "No Email",
    avatar: rawSidebarAvatar,
    role: extUser?.role as string | undefined,
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 bg-white" {...props}>
      <SidebarHeader className="pt-4 pb-6 px-4 border-b border-slate-100/60">
        <div className="flex items-center gap-3">
          {/* <div className="flex aspect-square size-[42px] items-center justify-center rounded-2xl bg-[#98BF4A] text-white shadow-[0_6px_16px_-4px_rgba(152,191,74,0.5)]"> */}
          <Image
            src="/logo-ilms.jpeg"
            alt="Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          {/* </div> */}
          <div className="flex flex-col gap-1 leading-none mt-1">
            <span className="text-[20px] font-black tracking-wide text-[#232B39]">
              RKWK Library
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[#94A3B8] uppercase">
              Taman Bacaan Masyarakat
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <NavMain items={NAV_DATA.navMain} />
        <NavSecondary items={NAV_DATA.navSecondary} />
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-100/60 py-2 bg-white">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
