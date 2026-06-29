"use client";

import { SiteHeader } from "@/components/site-header";
import { Book, BookOpen, Star, UserPlus, List, Heart, CheckCircle2, Clock, Bookmark, ArrowLeft, FileSpreadsheet, Medal, Trophy, Loader2, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import peminjamanData from "@/data/peminjaman.json";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useAdminDashboardQuery, useAdminLoanTrendsQuery, useAdminLiteracyAnalyticsQuery } from "@/services/dashboard.service";
import { usePopularBooksQuery } from "@/services/books.service";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
}

const indonesianMonths = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" }
];

export default function AnalitikPage() {
  const [filterType, setFilterType] = useState<"yearly" | "monthly">("yearly");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [chartData, setChartData] = useState<ChartData<"bar"> | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  // Fetch API data
  const { data: dashboardResp, isLoading: isLoadingDashboard } = useAdminDashboardQuery();

  const apiYear = selectedYear === "Semua" ? (filterType === "monthly" ? new Date().getFullYear() : undefined) : parseInt(selectedYear);
  const apiMonth = filterType === "monthly" ? parseInt(selectedMonth) : undefined;

  const { data: trendsResp, isLoading: isLoadingTrends } = useAdminLoanTrendsQuery(
    { year: apiYear, month: apiMonth },
    { skip: false }
  );

  const { data: literacyResp, isLoading: isLoadingLiteracy } = useAdminLiteracyAnalyticsQuery();
  const { data: popularResp, isLoading: isLoadingPopular } = usePopularBooksQuery({ limit: 5 });
  const { data: session } = useSession();
  const token = session?.user?.token;

  const dashboardData = (dashboardResp?.data as DashboardData) || {};
  const trendsData = trendsResp?.data as TrendsData | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const literacyData = (literacyResp?.data as any) || null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popularBooks = (popularResp?.data as any[]) || [];

  const handleDownloadPNG = () => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.canvas;
    if (!canvas) return;

    const padding = 40; // Border padding (40px) agar konten tidak terlalu mepet
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width + padding * 2;
    tempCanvas.height = canvas.height + padding * 2;
    const tempCtx = tempCanvas.getContext("2d");
    
    if (tempCtx) {
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, padding, padding);
      
      const url = tempCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      
      const labelBulan = filterType === "monthly" 
        ? "_" + (indonesianMonths.find(m => m.value === selectedMonth)?.label || selectedMonth)
        : "";
      a.download = `tren_peminjaman${labelBulan}_${selectedYear}.png`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const dataYears = Array.from(new Set(peminjamanData.map(item => item.borrowDate.split(" ")[2])));
    const minYear = Math.min(...dataYears.map(Number).filter(y => !isNaN(y)));
    
    const years = [];
    const startYear = isFinite(minYear) && minYear < currentYear ? minYear : currentYear;
    for (let y = currentYear; y >= startYear; y--) {
      years.push(y.toString());
    }
    return years;
  }, []);

  useEffect(() => {
    if (trendsData && trendsData.datasets && trendsData.datasets.length > 0) {
      const labels = trendsData.labels || (filterType === 'monthly' ? [] : ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES']);
      
      const chartDatasets = trendsData.datasets.map((dataset, i) => {
        const dataArr = dataset.data || new Array(labels.length).fill(0);
        const maxCount = Math.max(...dataArr, 1);
        
        // Peminjaman typically first, Pengembalian second
        const baseColor = i === 0 ? '#99BD4A' : '#e2e8f0'; 
        const activeColor = i === 0 ? '#88ab3d' : '#cbd5e1';

        return {
          label: dataset.label || (i === 0 ? 'Buku Dipinjam' : 'Buku Dikembalikan'),
          data: dataArr,
          backgroundColor: dataArr.map((val: number) => 
            val === maxCount && val > 0 ? baseColor : (i === 0 ? '#d4f09e' : '#f1f5f9')
          ),
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: 'bottom',
          hoverBackgroundColor: activeColor,
          categoryPercentage: 1.0,
          barPercentage: 1.0,
        };
      });

      setChartData({
        labels: labels,
        datasets: chartDatasets as ChartData<"bar">["datasets"]
      });
      return;
    }

    const monthsMap: Record<string, number> = {
      "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "Mei": 4, "Jun": 5,
      "Jul": 6, "Agu": 7, "Sep": 8, "Okt": 9, "Nov": 10, "Des": 11
    };

    if (filterType === "monthly") {
      const yearStr = selectedYear === "Semua" ? new Date().getFullYear().toString() : selectedYear;
      const monthNum = parseInt(selectedMonth);
      const days = new Date(parseInt(yearStr), monthNum, 0).getDate();
      const dailyCounts = new Array(days).fill(0);
      const labels = Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, '0'));
      
      peminjamanData.forEach(item => {
        const parts = item.borrowDate.split(" ");
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parts[1];
          const year = parts[2];
          
          const monthIndex = monthsMap[month] + 1;
          if (year === yearStr && monthIndex === monthNum) {
            if (day >= 1 && day <= days) {
              dailyCounts[day - 1]++;
            }
          }
        }
      });
      
      const maxCount = Math.max(...dailyCounts);
      setChartData({
        labels,
        datasets: [
          {
            label: 'Peminjaman',
            data: dailyCounts,
            backgroundColor: dailyCounts.map((val) => 
              val === maxCount && val > 0 ? '#99BD4A' : '#e2e8f0'
            ),
            borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: 'bottom',
            hoverBackgroundColor: '#88ab3d',
            categoryPercentage: 1.0,
            barPercentage: 1.0,
          }
        ]
      });
      return;
    }

    // Fallback logic if no API data yet
    const monthlyCounts = new Array(12).fill(0);

    peminjamanData.forEach(item => {
      const parts = item.borrowDate.split(" ");
      if (parts.length === 3) {
        const month = parts[1];
        const year = parts[2];
        if (selectedYear === "Semua" || selectedYear === year) {
          const monthIndex = monthsMap[month];
          if (monthIndex !== undefined) {
            monthlyCounts[monthIndex]++;
          }
        }
      }
    });

    const maxCount = Math.max(...monthlyCounts);

    setChartData({
      labels: ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'],
      datasets: [
        {
          label: 'Peminjaman',
          data: monthlyCounts,
          backgroundColor: monthlyCounts.map((val) => 
            val === maxCount && val > 0 ? '#99BD4A' : '#e2e8f0'
          ),
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: 'bottom',
          hoverBackgroundColor: '#88ab3d',
          categoryPercentage: 1.0,
          barPercentage: 1.0,
        }
      ]
    });
  }, [selectedYear, selectedMonth, filterType, trendsData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 11, weight: 'bold' as const }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 11 },
        bodyFont: { size: 13, weight: 'bold' as const },
        padding: 10,
        displayColors: true,
      }
    },
    scales: {
      y: {
        display: false,
        beginAtZero: true,
        grid: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          color: '#94a3b8'
        },
        border: { display: false }
      }
    }
  };

  const totalBuku = dashboardData?.summary?.total_books || 0;
  const anggotaAktif = dashboardData?.summary?.total_members || 0;
  const permintaanPending = dashboardData?.summary?.pending_verifications || 0;
  const aktivitasTerbaru = dashboardData?.recent_activities?.slice(0, 3) || [];

  const handleExportExcel = async () => {
    if (!token) return;
    setIsExporting(true);
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/analytics/literacy/export?format=excel`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const windowUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = windowUrl;
      a.download = `literacy_report_${new Date().getTime()}.xlsx`;
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

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <SiteHeader 
        title="Pantau Peminjaman Buku" 
        subtitle="Analisis peminjaman buku pada perpustakaan" 
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Dashboard Analitik</h2>
            <p className="text-sm font-medium text-slate-500">
              Analisis mendalam performa literasi Rumah Kreatif Wadas Kelir.
            </p>
          </div>
          
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

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Buku */}
          <Card className="p-6 border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Buku</p>
              <div className="w-8 h-8 rounded-lg bg-[#F4F7F4] flex items-center justify-center">
                <Book className="w-4 h-4 text-[#99BD4A]" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">
              {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : totalBuku.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5">
            </div>
          </Card>

          {/* Anggota Aktif */}
          <Card className="p-6 border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Anggota Aktif</p>
              <div className="w-8 h-8 rounded-lg bg-[#F4F7F4] flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-[#99BD4A]" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">
              {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : anggotaAktif.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5">
            </div>
          </Card>

          {/* Permintaan Pinjam */}
          <Card className="p-6 border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Permintaan Pinjam</p>
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <List className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">
              {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : permintaanPending.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" strokeWidth={3} />
              <span className="text-[11px] font-bold text-orange-500">Menunggu konfirmasi</span>
            </div>
          </Card>

            {/* Tingkat Literasi */}
            <Card className="p-6 border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tingkat Literasi</p>
                <div className="w-8 h-8 rounded-lg bg-[#F4F7F4] flex items-center justify-center">
                  <Heart className="w-4 h-4 text-[#99BD4A]" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-2">
                {isLoadingLiteracy ? <Skeleton className="h-8 w-16" /> : `${literacyData?.literacy_index || 0}%`}
              </h3>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#99BD4A]" strokeWidth={3} />
                <span className="text-[11px] font-bold text-[#99BD4A]">Indeks Komposit</span>
              </div>
            </Card>
          </div>

        {/* CHARTS & ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TREN PEMINJAMAN CHART */}
          <Card className="col-span-1 lg:col-span-2 p-6 md:p-8 border-0 shadow-sm rounded-3xl bg-white flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">
                  Tren Peminjaman {filterType === "monthly" ? "Harian" : "Bulanan"}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {filterType === "monthly" 
                    ? "Volume aktivitas peminjaman buku per hari" 
                    : "Volume aktivitas peminjaman buku per bulan"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Mode Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("yearly");
                      if (selectedYear === "Semua") {
                        setSelectedYear(new Date().getFullYear().toString());
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterType === "yearly"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Tahunan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("monthly");
                      if (selectedYear === "Semua") {
                        setSelectedYear(new Date().getFullYear().toString());
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterType === "monthly"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Bulanan
                  </button>
                </div>

                {/* Month Dropdown */}
                {filterType === "monthly" && (
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[120px] h-9 text-xs font-bold bg-white border-slate-200 rounded-xl focus:ring-[#99BD4A]">
                      <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {indonesianMonths.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-xs font-bold">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Year Dropdown */}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[110px] h-9 text-xs font-bold bg-white border-slate-200 rounded-xl focus:ring-[#99BD4A]">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterType === "yearly" && (
                      <SelectItem value="Semua" className="text-xs font-bold">Semua Tahun</SelectItem>
                    )}
                    {yearsList.map((year) => (
                      <SelectItem key={year} value={year} className="text-xs font-bold">
                        Tahun {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Download PNG Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownloadPNG}
                  className="w-9 h-9 border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-[#99BD4A] transition-colors"
                  title="Unduh Grafik (PNG)"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full h-[240px] mt-auto relative">
              {isLoadingTrends ? (
                <div className="w-full h-full flex flex-col gap-2 justify-end">
                   <Skeleton className="w-full h-[80%]" />
                </div>
              ) : chartData ? (
                <Bar ref={chartRef} data={chartData} options={chartOptions} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                  Memuat grafik...
                </div>
              )}
            </div>
          </Card>

          {/* AKTIVITAS TERBARU */}
          <Card className="col-span-1 p-6 border-0 shadow-sm rounded-3xl bg-white flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[17px] font-black text-slate-800">Aktivitas Terbaru</h3>
              <Link href="/admin/aktivitas" className="text-[11px] font-bold text-[#99BD4A] hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-6 h-[300px] overflow-y-auto pr-2">
              {isLoadingDashboard ? (
                <div className="flex justify-center py-4"><Skeleton className="h-8 w-8 rounded-full" /></div>
              ) : aktivitasTerbaru.length > 0 ? (
                aktivitasTerbaru.map((act: RecentActivity, idx: number) => {
                  const isReturned = act.type === 'returned';
                  return (
                    <div key={idx} className="flex gap-4 items-start relative pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className={`w-9 h-9 rounded-full ${isReturned ? 'bg-green-100 text-green-600' : 'bg-[#F4F7F4] text-[#99BD4A]'} flex items-center justify-center shrink-0 z-10 mt-1`}>
                        {isReturned ? <ArrowLeft className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-800">{act.member_name}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${isReturned ? 'bg-green-50 text-green-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {act.type}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">{act.description}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{act.time || act.date}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500 py-4 text-center">Belum ada aktivitas.</div>
              )}
            </div>
          </Card>
        </div>

        {/* LEADERBOARD & LITERACY SCORES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* LITERACY INDICATORS */}
          <Card className="col-span-1 p-6 border-0 shadow-sm rounded-3xl bg-white flex flex-col">
            <h3 className="text-[17px] font-black text-slate-800 mb-2">Skor Indikator Literasi</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Bobot perhitungan indeks tingkat literasi</p>
            
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Circulation Rate</span>
                  <span className="text-sm font-black text-[#99BD4A]">{literacyData?.scores?.circulation_rate_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-[#99BD4A] h-2.5 rounded-full" style={{ width: `${literacyData?.scores?.circulation_rate_score || 0}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-right">Bobot: 40%</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Punctuality Rate</span>
                  <span className="text-sm font-black text-blue-500">{literacyData?.scores?.punctuality_rate_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${literacyData?.scores?.punctuality_rate_score || 0}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-right">Bobot: 40%</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Program Engagement</span>
                  <span className="text-sm font-black text-purple-500">{literacyData?.scores?.engagement_rate_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${literacyData?.scores?.engagement_rate_score || 0}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-right">Bobot: 20%</p>
              </div>
            </div>
          </Card>

          {/* LEADERBOARD TABLE */}
          <Card className="col-span-1 lg:col-span-2 p-6 md:p-8 border-0 shadow-sm rounded-3xl bg-white flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Leaderboard Member</h3>
                <p className="text-xs font-medium text-slate-500">Peringkat teratas berdasarkan pengumpulan Poin Komunitas (EXP)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest w-12 text-center">Rank</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest">Nama Member</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest text-center">Level</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest text-right">Total EXP</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoadingLiteracy ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">Memuat leaderboard...</td>
                    </tr>
                  ) : literacyData && literacyData.leaderboard && literacyData.leaderboard.length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    literacyData.leaderboard.map((member: any, idx: number) => (
                      <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 px-4 text-center">
                          {idx === 0 ? (
                            <div className="mx-auto w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-black shadow-sm">1</div>
                          ) : idx === 1 ? (
                            <div className="mx-auto w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black shadow-sm">2</div>
                          ) : idx === 2 ? (
                            <div className="mx-auto w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black shadow-sm">3</div>
                          ) : (
                            <span className="font-bold text-slate-400">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 group-hover:text-[#99BD4A] transition-colors">{member.name}</span>
                            <span className="text-[10px] font-medium text-slate-400">{member.member_code}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600">
                            <Medal className="w-3 h-3" />
                            <span className="font-black text-xs">{member.level}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-slate-700 text-[15px]">{member.exp.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data member.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* POPULAR BOOKS LEADERBOARD */}
        <div className="grid grid-cols-1 gap-6 mt-6">
          <Card className="col-span-1 p-6 md:p-8 border-0 shadow-sm rounded-3xl bg-white flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Leaderboard Buku Terpopuler</h3>
                <p className="text-xs font-medium text-slate-500">Peringkat buku yang paling sering dipinjam oleh pemustaka</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest w-12 text-center">Rank</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest">Judul Buku</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest">Pengarang</th>
                    <th className="py-3 px-4 font-bold text-xs text-slate-400 uppercase tracking-widest text-right">Total Pinjaman</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoadingPopular ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">Memuat buku terpopuler...</td>
                    </tr>
                  ) : popularBooks && popularBooks.length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    popularBooks.map((book: any, idx: number) => {
                      let rawCover = book.cover_url || book.cover_image || book.image;
                      if (rawCover && !rawCover.startsWith('http') && !rawCover.startsWith('/images') && !rawCover.startsWith('data:')) {
                        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
                        rawCover = `${baseUrl}/${rawCover.replace(/^\//, '')}`;
                      }
                      
                      return (
                      <tr key={book.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 px-4 text-center">
                          {idx === 0 ? (
                            <div className="mx-auto w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-black shadow-sm">1</div>
                          ) : idx === 1 ? (
                            <div className="mx-auto w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black shadow-sm">2</div>
                          ) : idx === 2 ? (
                            <div className="mx-auto w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black shadow-sm">3</div>
                          ) : (
                            <span className="font-bold text-slate-400">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-10 bg-slate-100 rounded overflow-hidden shrink-0">
                              {rawCover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={rawCover} alt={book.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-slate-700 group-hover:text-purple-600 transition-colors line-clamp-2">{book.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{book.author}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-slate-700 text-[15px]">{book.loans_count || 0}</span>
                        </td>
                      </tr>
                    );
                  })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data buku terpopuler.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
