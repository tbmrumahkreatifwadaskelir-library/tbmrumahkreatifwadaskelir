"use client";

import { IconChevronDown, type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";

// 1. Definisikan tipe data secara rekursif
interface NavItem {
  title: string;
  url: string;
  icon?: Icon;
  children?: NavItem[]; // Children bisa memiliki NavItem lagi
}

// Helper untuk mengecek apakah item atau salah satu anak/cucunya sedang aktif
const checkIsActive = (href: string, item: NavItem): boolean => {
  if (href === item.url) return true;
  if (item.children) {
    return item.children.some((child) => checkIsActive(href, child));
  }
  return false;
};

// 2. Komponen Rekursif untuk merender item
const NavNode = ({
  item,
  pathname,
  openMenus,
  toggleMenu,
}: {
  item: NavItem;
  pathname: string;
  openMenus: string[];
  toggleMenu: (title: string) => void;
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = checkIsActive(pathname, item);
  const isOpen = openMenus.includes(item.title);

  // Jika item memiliki children
  if (hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          onClick={(e) => {
            e.preventDefault(); // Mencegah navigasi jika itu link parent
            toggleMenu(item.title);
          }}
          className={
            isActive
              ? "bg-[#98BF4A]/10 text-[#98BF4A] hover:bg-[#98BF4A]/15 hover:text-[#98BF4A] font-semibold h-[50px] px-4 rounded-xl transition-colors duration-200"
              : "text-[#64748b] hover:bg-[#98BF4A]/10 hover:text-[#98BF4A] font-medium h-[50px] px-4 rounded-xl transition-colors duration-200"
          }
        >
          {item.icon && <item.icon className="size-[22px] mr-3" stroke={2} />}
          <span className="flex-1 text-[15px]">{item.title}</span>
          <IconChevronDown
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={18}
          />
        </SidebarMenuButton>

        {/* Render Children secara Rekursif */}
        {isOpen && (
          <div className="pl-4 border-l border-sidebar-border ml-2 flex flex-col gap-1 mt-1">
            {item.children!.map((child) => (
              <NavNode
                key={child.title}
                item={child}
                pathname={pathname}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
              />
            ))}
          </div>
        )}
      </SidebarMenuItem>
    );
  }

  // Jika item tidak memiliki children (Leaf node)
  return (
    <SidebarMenuItem>
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
          {item.icon && <item.icon className="size-[22px] mr-3" stroke={2} />}
          <span className="text-[15px]">{item.title}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
};

// 3. Komponen Utama
export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = useCallback((title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }, []);

  return (
    <SidebarGroup className="px-6 py-4">
      <SidebarGroupLabel className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] mb-4 p-0">
        MENU UTAMA
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <NavNode
              key={item.title}
              item={item}
              pathname={pathname}
              openMenus={openMenus}
              toggleMenu={toggleMenu}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
