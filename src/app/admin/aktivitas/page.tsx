"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminDashboardQuery } from "@/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

export interface RecentActivity {
  id?: number | string;
  type?: string;
  member_name?: string;
  description?: string;
  time?: string;
  date?: string;
}

interface DashboardData {
  recent_activities?: RecentActivity[];
}

export default function AktivitasPage() {
  const { data: dashboardResp, isLoading } = useAdminDashboardQuery();
  
  const dashboardData = (dashboardResp?.data as DashboardData) || {};
  const logsData = dashboardData.recent_activities || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Semua Aktivitas"
        subtitle="Log aktivitas sistem perpustakaan"
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Aktivitas Sistem
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Pantau seluruh aktivitas yang terjadi di dalam sistem
            </p>
          </div>
        </div>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-0">
            <div className="rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider w-[200px]">
                      WAKTU
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      AKTOR
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      TIPE AKTIVITAS
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs tracking-wider">
                      DESKRIPSI
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      </TableRow>
                    ))
                  ) : logsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        Tidak ada log aktivitas ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logsData.map((log: RecentActivity, idx: number) => (
                      <TableRow key={idx} className="hover:bg-slate-50/50">
                        <TableCell className="py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {log.date || log.time || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {log.member_name || "Sistem"}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md uppercase ${log.type === 'returned' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {log.type || "LOG"}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
