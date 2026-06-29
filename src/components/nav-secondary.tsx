"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-6 py-2" {...props}>
      <SidebarGroupLabel className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.12em] mb-3 p-0">
        ANALITIK & SISTEM
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url} className="w-full">
                <SidebarMenuButton 
                  tooltip={item.title}
                  data-state={pathname === item.url ? "active" : undefined}
                  className={
                    pathname === item.url
                      ? "bg-[#98BF4A]/10 text-[#98BF4A] hover:bg-[#98BF4A]/15 hover:text-[#98BF4A] font-semibold h-[50px] px-4 rounded-xl transition-colors duration-200"
                      : "text-[#5e6e82] hover:bg-[#98BF4A]/10 hover:text-[#98BF4A] font-medium h-[50px] px-4 rounded-xl transition-colors duration-200"
                  }
                >
                  <item.icon className="size-[22px] mr-3 shrink-0" stroke={2} />
                  <span className="text-[15px]">{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
