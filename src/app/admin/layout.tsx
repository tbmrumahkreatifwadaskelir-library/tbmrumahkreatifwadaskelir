import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionExpirationModal } from "@/components/admin/session-expiration-modal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 82)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-muted/30 md:!mt-0 md:rounded-t-none">
        {children}
      </SidebarInset>
      <SessionExpirationModal />
    </SidebarProvider>
  );
}
