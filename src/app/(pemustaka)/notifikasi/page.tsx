"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, CalendarDays } from "lucide-react";
import notifikasiData from "@/json/notifikasi.json";
import { useGetNotificationsQuery, useMarkAllNotificationsAsReadMutation, useMarkNotificationAsReadMutation } from "@/services/notification.service";

const typeConfig: Record<string, { label: string; labelColor: string; bgColor: string; iconColor: string; icon: React.ReactNode }> = {
  PEMINJAMAN: {
    label: "PEMINJAMAN",
    labelColor: "text-[#99BD4A]",
    bgColor: "bg-[#f4f7ee]",
    iconColor: "text-[#99BD4A]",
    icon: <CheckCircle2 className="w-5 h-5 text-[#99BD4A]" />,
  },
  PENGINGAT: {
    label: "PENGINGAT",
    labelColor: "text-[#ea580c]",
    bgColor: "bg-[#fff7ed]",
    iconColor: "text-[#ea580c]",
    icon: <Clock className="w-5 h-5 text-[#ea580c]" />,
  },
  KEGIATAN: {
    label: "KEGIATAN",
    labelColor: "text-[#2563eb]",
    bgColor: "bg-[#eff6ff]",
    iconColor: "text-[#2563eb]",
    icon: <CalendarDays className="w-5 h-5 text-[#2563eb]" />,
  },
};

export default function NotifikasiPage() {
  const { data: notificationsDataRes, refetch } = useGetNotificationsQuery({ page: 1, paginate: 50 });
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [notifications, setNotifications] = useState(notifikasiData);

  useEffect(() => {
    if (notificationsDataRes?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = notificationsDataRes.data.map((notif: any) => {
        let type = "PEMINJAMAN";
        const dataObj = typeof notif.data === 'string' ? JSON.parse(notif.data) : (notif.data || {});
        const dataType = dataObj.type || notif.type;

        if (dataType === "PENGINGAT" || dataType === "warning" || dataType === "overdue") type = "PENGINGAT";
        else if (dataType === "KEGIATAN" || dataType === "info" || dataType === "member_verified") type = "KEGIATAN";

        return {
          id: notif.id,
          type: type,
          message: dataObj.message || dataObj.description || dataObj.title || notif.message || "",
          time: notif.time_ago || (notif.created_at ? new Date(notif.created_at).toLocaleDateString("id-ID") : "Baru saja"),
          isRead: notif.is_read ?? (notif.read_at !== null),
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

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1000px] mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[#64748b] text-[12px] font-bold tracking-[0.15em] uppercase mb-1">
              Pusat Informasi
            </p>
            <h1 className="text-[28px] sm:text-[32px] md:text-[38px] font-extrabold text-[#0F172A] tracking-tight leading-none">
              Notifikasi
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:border-slate-300 bg-white rounded-xl text-[13px] font-bold text-[#334155] hover:bg-slate-50 transition-colors shadow-sm"
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Notification List — single card container with dividers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {notifications.map((notif, index) => {
            const config = typeConfig[notif.type] || typeConfig.KEGIATAN;

            return (
              <div key={notif.id}>
                <div
                  onClick={() => handleMarkAsRead(notif.id as string, notif.isRead)}
                  className={`flex items-start sm:items-center gap-4 sm:gap-5 px-5 sm:px-7 py-5 sm:py-6 transition-colors ${
                    notif.isRead ? "opacity-60 cursor-default" : "cursor-pointer hover:bg-slate-50"
                  }`}
                >
                  {/* Icon Circle */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 mt-1 sm:mt-0 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}
                  >
                    {config.icon}
                  </div>

                  {/* Content & Time */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[10px] sm:text-[11px] font-extrabold tracking-[0.12em] uppercase ${config.labelColor} block mb-1`}
                      >
                        {config.label}
                      </span>
                      <p className="text-[14px] sm:text-[15px] font-bold text-[#1e293b] leading-snug">
                        {notif.message}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="text-[#94a3b8] text-[12px] sm:text-[13px] font-medium whitespace-nowrap shrink-0">
                      {notif.time}
                    </span>
                  </div>
                </div>

                {/* Divider between items */}
                {index < notifications.length - 1 && (
                  <div className="mx-5 sm:mx-7 border-b border-slate-100" />
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500 font-medium">
              Tidak ada notifikasi saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
