"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Users, 
  ClipboardList, 
  Upload,
  ArrowLeft,
  Bookmark,
  Star,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { MonthlyLoanChart } from "@/components/admin/monthly-loan-chart";
import { useAdminDashboardQuery, useAdminLoanTrendsQuery } from "@/services/dashboard.service";
import { usePopularBooksQuery } from "@/services/books.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface RecentActivity {
  id?: number | string;
  type?: string;
  member_name?: string;
  description?: string;
  time?: string;
  date?: string;
}

interface DashboardSummary {
  total_books?: number;
  total_members?: number;
  total_loans?: number;
  active_loans?: number;
  overdue_loans?: number;
  pending_loans?: number;
  pending_verifications?: number;
  returned_this_month?: number;
}

interface DashboardData {
  summary?: DashboardSummary;
  recent_activities?: RecentActivity[];
}

interface TrendsDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
}

interface TrendsData {
  labels: string[];
  datasets: TrendsDataset[];
  total_loans?: number;
  year?: number;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const token = session?.user?.token;
  const { data: dashboardResp, isLoading: isLoadingDashboard } = useAdminDashboardQuery();
  const { data: trendsResp, isLoading: isLoadingTrends } = useAdminLoanTrendsQuery();
  const { data: popularResp, isLoading: isLoadingPopular } = usePopularBooksQuery({ limit: 5 });

  const dashboardData = (dashboardResp?.data as DashboardData) || {};
  const trendsData = trendsResp?.data as TrendsData | undefined; // The chart handles its own typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popularBooks = (popularResp?.data as any[]) || [];
  
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (!token) return;
    setIsExporting(true);
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/dashboard/export?format=excel`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const windowUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = windowUrl;
      a.download = `dashboard_report_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(windowUrl);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  if (isLoadingDashboard) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50 p-8 space-y-6">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  // Use API data only
  const totalBuku = dashboardData?.summary?.total_books || 0;
  const anggotaAktif = dashboardData?.summary?.total_members || 0;
  const permintaanPending = dashboardData?.summary?.pending_verifications || 0;
  const bukuKeluar = dashboardData?.summary?.active_loans || 0;
  const aktivitasTerbaru = dashboardData?.recent_activities?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader 
        title="Dashboard Admin" 
        subtitle="Ringkasan aktivitas TBM Rumah Kreatif Wadas Kelir hari ini" 
      />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">Ringkasan Sistem</h2>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 text-green-600 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              )}
              {isExporting ? "Mengekspor..." : "Export Excel"}
            </Button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Total Buku</p>
              <h3 className="text-2xl font-bold mt-1">{totalBuku.toLocaleString()}</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Total Anggota</p>
              <h3 className="text-2xl font-bold mt-1">{anggotaAktif.toLocaleString()}</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Menunggu Verifikasi</p>
              <h3 className="text-2xl font-bold mt-1">{permintaanPending.toLocaleString()}</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Buku Dipinjam</p>
              <h3 className="text-2xl font-bold mt-1">{bukuKeluar.toLocaleString()}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Chart Section */}
          <Card className="lg:col-span-2 shadow-sm border-slate-100 h-[400px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Tren Peminjaman Bulanan</CardTitle>
                <CardDescription>Aktivitas peminjaman sepanjang tahun ini</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 inline-block mr-2">
                  {!isLoadingTrends && trendsData?.year ? trendsData.year : ""}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4 pb-4 px-4 sm:px-6">
              {!isLoadingTrends && <MonthlyLoanChart dynamicData={trendsData} />}
            </CardContent>
          </Card>

          {/* Recent Activity Section */}
          <Card className="shadow-sm border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Aktivitas Terbaru</CardTitle>
              <Link href="/admin/aktivitas" className="text-xs text-green-600 font-medium hover:underline">
                Lihat Semua
              </Link>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 h-[300px] overflow-y-auto">
              {isLoadingDashboard ? (
                <div className="flex justify-center py-4"><Skeleton className="h-8 w-8 rounded-full" /></div>
              ) : aktivitasTerbaru.length > 0 ? (
                aktivitasTerbaru.map((act: RecentActivity, idx: number) => {
                  const isReturned = act.type === 'returned';
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className={`${isReturned ? 'bg-green-100' : 'bg-blue-100'} p-2 rounded-full h-fit mt-1 shrink-0`}>
                        {isReturned ? <ArrowLeft className="w-4 h-4 text-green-600" /> : <Bookmark className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{act.member_name || "Sistem"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{act.time || act.date}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">Belum ada aktivitas.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Popular Books Section */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 mt-6">
          <Card className="shadow-sm border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <CardTitle className="text-lg font-bold">Buku Terpopuler</CardTitle>
              </div>
              <Link href="/admin/buku" className="text-xs text-green-600 font-medium hover:underline">
                Kelola Buku
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {isLoadingPopular ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                  ))
                ) : popularBooks.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  popularBooks.map((book: any, idx: number) => {
                    let rawCover = book.cover_url || book.cover_image || book.image;
                    if (rawCover && !rawCover.startsWith('http') && !rawCover.startsWith('/images') && !rawCover.startsWith('data:')) {
                      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
                      rawCover = `${baseUrl}/${rawCover.replace(/^\//, '')}`;
                    }

                    return (
                    <div key={book.id || idx} className="flex flex-col gap-3 p-3 rounded-xl border border-slate-100 hover:border-green-200 hover:bg-green-50/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-16 bg-slate-100 rounded overflow-hidden shrink-0">
                          {rawCover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={rawCover} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                              <BookOpen className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 line-clamp-2" title={book.title}>{book.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{book.author}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{book.loans_count || 0}</span>
                            <span className="text-[10px] font-medium text-slate-400">kali dipinjam</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
                ) : (
                  <div className="col-span-full text-sm text-slate-500 text-center py-4">Belum ada data buku terpopuler.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground font-medium gap-4">
        <div>
          © 2026 Rumah Kreatif Wadas Kelir. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
