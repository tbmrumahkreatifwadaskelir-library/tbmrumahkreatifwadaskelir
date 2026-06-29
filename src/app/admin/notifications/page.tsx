"use client";

import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Check } from "lucide-react";
import { useGetNotificationsQuery, useMarkAllNotificationsAsReadMutation, useMarkNotificationAsReadMutation } from "@/services/notification.service";
import { useState, useEffect } from "react";

export default function NotificationsPage() {
  const { data: notificationsDataRes, refetch } = useGetNotificationsQuery({ page: 1, paginate: 50 });
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (notificationsDataRes?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = notificationsDataRes.data.map((notif: any) => {
        let type = "info";
        const dataObj = typeof notif.data === 'string' ? JSON.parse(notif.data) : (notif.data || {});
        const dataType = dataObj.type || notif.type;

        if (dataType === "PENGINGAT" || dataType === "warning" || dataType === "overdue") type = "warning";
        else if (dataType === "PEMINJAMAN" || dataType === "success" || dataType === "member_verified") type = "success";

        return {
          id: notif.id,
          type: type,
          title: dataObj.title || (dataType === "member_verified" ? "Verifikasi Member" : dataType) || "Notifikasi",
          message: dataObj.message || dataObj.description || notif.message || "",
          createdAt: notif.time_ago || (notif.created_at ? new Date(notif.created_at).toLocaleString("id-ID") : "Baru saja"),
          read: notif.is_read ?? (notif.read_at !== null),
        };
      });
      setNotifications(mapped);
    }
  }, [notificationsDataRes]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await markAsRead({ id }).unwrap();
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notificationsDataRes?.unread_count || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "success": return "bg-emerald-50";
      case "warning": return "bg-amber-50";
      case "info":
      default:
        return "bg-blue-50";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <SiteHeader 
        title="Pusat Notifikasi" 
        subtitle="Pantau semua aktivitas dan pemberitahuan sistem" 
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1000px] w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Notifikasi Sistem</h2>
            <p className="text-sm font-medium text-slate-500">
              Pemberitahuan aktivitas, peringatan, dan pembaruan perpustakaan.
            </p>
          </div>
          <div className="w-12 h-12 bg-[#F4F7F4] rounded-2xl flex items-center justify-center shadow-sm">
            <Bell className="w-6 h-6 text-[#99BD4A]" />
          </div>
        </div>

        <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <h3 className="text-[17px] font-black text-slate-800">Semua Pemberitahuan</h3>
              {unreadCount > 0 && (
                <span className="bg-[#99BD4A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs font-bold text-[#99BD4A] hover:text-[#88ab3d] transition-colors bg-[#F4F7F4] px-3 py-1.5 rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100/80">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleMarkAsRead(notif.id, notif.read)}
                className={`p-6 flex items-start gap-4 transition-all relative ${
                  !notif.read ? "bg-white cursor-pointer hover:bg-slate-50" : "bg-slate-50/30 opacity-60 cursor-default"
                }`}
              >
                {/* Indicator for unread */}
                {!notif.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#99BD4A]" />
                )}

                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBadgeClass(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-[15px] font-bold truncate pr-4 ${!notif.read ? "text-slate-800" : "text-slate-600"}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {notif.createdAt}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-slate-500 leading-relaxed pr-8">
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                )}
              </div>
            ))}
            
            {notifications.length === 0 && (
              <div className="p-10 text-center text-slate-500">
                Tidak ada notifikasi saat ini.
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
