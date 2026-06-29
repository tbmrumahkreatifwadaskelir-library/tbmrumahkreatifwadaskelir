"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useListMembersQuery } from "@/services/members.service";

const ITEMS_PER_PAGE = 10;

export default function PengelolaanPeminjamPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Ambil data anggota dengan status aktif
  const { data: membersRes, isLoading } = useListMembersQuery({ status: "active" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let membersList: any[] = [];
  if (membersRes?.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = membersRes.data as any;
    let rawArray = [];
    if (Array.isArray(data)) rawArray = data;
    else if (data.members && Array.isArray(data.members)) rawArray = data.members;
    else if (data.data && Array.isArray(data.data)) rawArray = data.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    membersList = rawArray.map((m: any) => {
      const user = m.user || {};
      let rawAvatar = user.avatar_url || user.avatar || m.avatar_url || m.avatar || "/images/avatars/default.png";
      if (rawAvatar && rawAvatar !== "/images/avatars/default.png" && !rawAvatar.startsWith('http') && !rawAvatar.startsWith('/images') && !rawAvatar.startsWith('data:')) {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
        rawAvatar = `${baseUrl}/${rawAvatar.replace(/^\//, '')}`;
      }

      return {
        id: m.member_code || m.nik_nisn || m.id?.toString(),
        name: user.name || m.name || "Tanpa Nama",
        memberSince: m.created_at
          ? new Date(m.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "-",
        totalBorrows: `${m.total_loans || 0} Buku`,
        activeLimit: "Batas Normal",
        notes: "*Data dari API ILMS*",
        image: rawAvatar,
      };
    });
  }

  const filteredMembers = membersList.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Pagination ──
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE) || 1;
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1); // reset ke halaman 1 saat search
  };

  const selectedMember =
    membersList.find((m) => m.id === selectedMemberId) ||
    (membersList.length > 0 ? membersList[0] : null);

  const handleProcess = () => {
    if (selectedMember) {
      router.push(
        `/admin/buku/scan?member_code=${selectedMember.id}&memberName=${encodeURIComponent(selectedMember.name)}`
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <SiteHeader
        title="Pengelolaan Peminjam Buku"
        subtitle="Kelola peminjam buku dengan search dan select anggota."
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* PILIH ANGGOTA */}
            <Card className="shadow-sm border-slate-100 rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h2 className="text-2xl font-black text-slate-800">Pilih Anggota</h2>
                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Cari Anggota..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-11 h-12 bg-slate-50/80 border-slate-200 rounded-xl font-medium focus-visible:ring-[#99BD4A]"
                    />
                  </div>
                </div>

                {/* Grid anggota */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {isLoading ? (
                    <div className="col-span-full py-12 flex justify-center items-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#99BD4A]" />
                    </div>
                  ) : paginatedMembers.length > 0 ? (
                    paginatedMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`relative p-4 rounded-2xl cursor-pointer transition-all ${
                          (selectedMemberId || selectedMember?.id) === member.id
                            ? "bg-white border-2 border-[#99BD4A] shadow-md shadow-[#99BD4A]/10"
                            : "bg-slate-50 border-2 border-transparent hover:border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {(selectedMemberId || selectedMember?.id) === member.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#99BD4A] rounded-full flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}

                        <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden mb-3 border-2 border-white shadow-sm relative">
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-[#1e293b] -z-10">
                            <span className="text-white text-xs font-bold">
                              {member.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-bold text-slate-800 text-xs leading-tight mb-0.5 line-clamp-2">
                          {member.name}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-400">ID: {member.id}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-slate-500 font-medium text-sm">
                      Anggota tidak ditemukan.
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {!isLoading && filteredMembers.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
                    <p className="text-[12px] text-slate-400 font-medium">
                      Menampilkan{" "}
                      <span className="font-bold text-slate-600">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)}
                      </span>{" "}
                      dari <span className="font-bold text-slate-600">{filteredMembers.length}</span> anggota
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 border-slate-200"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - currentPage) <= 1
                        )
                        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === "..." ? (
                            <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-400 text-sm">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={p}
                              variant={currentPage === p ? "default" : "outline"}
                              size="sm"
                              className={`w-8 h-8 text-xs ${
                                currentPage === p
                                  ? "bg-[#99BD4A] hover:bg-[#88ab3d] text-white border-none"
                                  : "border-slate-200"
                              }`}
                              onClick={() => setCurrentPage(p as number)}
                            >
                              {p}
                            </Button>
                          )
                        )}

                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 border-slate-200"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-5 space-y-4">

            {/* MEMBER DETAIL */}
            <Card className="shadow-sm border-slate-100 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                {selectedMember ? (
                  <div className="flex flex-col gap-5">
                    {/* Avatar + Nama */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden border-2 border-white shadow-md relative shrink-0">
                        <Image
                          src={selectedMember.image}
                          alt={selectedMember.name}
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1e293b] -z-10">
                          <span className="text-white text-lg font-bold">
                            {selectedMember.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 mb-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ACTIVE MEMBER
                        </div>
                        <h3 className="text-base font-black text-slate-800 leading-tight">{selectedMember.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">Anggota Terdaftar Perpustakaan</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MEMBER SINCE</p>
                        <p className="text-sm font-black text-slate-800">{selectedMember.memberSince}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL BORROWS</p>
                        <p className="text-sm font-black text-slate-800">{selectedMember.totalBorrows}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ACTIVE LIMIT</p>
                        <p className="text-sm font-black text-slate-800">{selectedMember.activeLimit}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TRUST SCORE</p>
                        <p className="text-sm font-black text-[#99BD4A] flex items-center gap-1">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {selectedMember.trustScore}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">RECENT NOTES</p>
                      <p className="text-xs font-medium text-slate-500 italic leading-relaxed">{selectedMember.notes}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center text-slate-300">
                    <Search className="w-10 h-10 mb-3" />
                    <p className="text-sm font-medium text-slate-400 text-center">Pilih anggota dari daftar untuk melihat detail.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PROSES PEMINJAMAN */}
            <Card className="shadow-sm border-slate-100 rounded-3xl">
              <CardContent className="p-6">
                <Button
                  onClick={handleProcess}
                  disabled={!selectedMember}
                  className="w-full bg-[#99BD4A] hover:bg-[#88ab3d] disabled:opacity-50 text-white font-black h-14 rounded-xl shadow-md text-sm uppercase tracking-widest flex items-center justify-between px-6 group"
                >
                  <span>PROSES PEMINJAMAN</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </div>
  );
}
