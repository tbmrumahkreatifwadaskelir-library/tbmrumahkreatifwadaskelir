"use client";

import { IconLogout } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLogoutMutation, useLogoutAllMutation } from "@/services/auth.service";
import { signOut } from "next-auth/react";
import Swal from "sweetalert2";
import { getErrorMessage } from "@/lib/error-utils";


export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    role?: string;
  };
}) {
  const [logout, { isLoading }] = useLogoutMutation();
  const [logoutAll, { isLoading: isLoggingOutAll }] = useLogoutAllMutation();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar dari Aplikasi?",
      text: "Pilih metode logout yang Anda inginkan:",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Logout Biasa",
      denyButtonText: "Logout Semua Perangkat",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: 'bg-[#99BD4A] hover:bg-[#88ab3d] text-white',
        denyButton: 'bg-orange-500 hover:bg-orange-600 text-white',
      }
    });

    if (result.isConfirmed) {
      try {
        await logout().unwrap();
        await signOut({ callbackUrl: "/login" });
      } catch (error: unknown) {
        console.error(error);
        const errorMessage = getErrorMessage(error);
        Swal.fire({ icon: "error", title: "Gagal", text: errorMessage });
      }
    } else if (result.isDenied) {
      try {
        await logoutAll().unwrap();
        await signOut({ callbackUrl: "/login" });
      } catch (error: unknown) {
        console.error(error);
        const errorMessage = getErrorMessage(error);
        Swal.fire({ icon: "error", title: "Gagal", text: errorMessage });
      }
    }
  };

  return (
    <SidebarMenu className="py-4">
      <SidebarMenuItem>
        <div className="flex items-center justify-between bg-[#F8FAFC] rounded-2xl p-3 pr-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 rounded-full bg-amber-100">
              <AvatarImage
                src={user.avatar}
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback className="rounded-full bg-amber-100 text-amber-800">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium text-[14.5px] text-[#64748B]">
                {user.name}
              </span>
              <span className="truncate text-[11px] text-[#94A3B8] font-medium mt-0.5">
                {user.role === "admin" ? "Administrator" : user.role === "member" ? "Anggota Aktif" : "Pengguna"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading || isLoggingOutAll}
            className="text-[#94A3B8] hover:text-red-500 transition-colors"
            title="Logout"
          >
            <IconLogout stroke={2} className="size-[22px]" />
          </button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
