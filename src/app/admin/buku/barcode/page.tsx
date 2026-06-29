"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Printer, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { generatePagination } from "@/lib/utils";
import Barcode from "react-barcode";
import { useEffect } from "react";
import { useListBooksQuery } from "@/services/books.service";

interface Buku {
  id: string;
  book_code: string;
  title: string;
  isbn: string;
  author: string;
  category: string;
  stock: number;
  status: string;
  coverColor: string;
  coverAccent: string;
}


export default function CetakBarcodePage() {
  const { data: booksApiRes } = useListBooksQuery({});
  const [booksState, setBooksState] = useState<Buku[]>([]);

  useEffect(() => {
    if (booksApiRes?.data) {
      let booksArray = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = booksApiRes.data as any;
      if (Array.isArray(data)) {
        booksArray = data;
      } else if (data.books && Array.isArray(data.books)) {
        booksArray = data.books;
      } else if (data.data && Array.isArray(data.data)) {
        booksArray = data.data;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = booksArray.map((b: any) => ({
        id: b.id.toString(),
        book_code: b.book_code || b.code || b.item_code || "-",
        title: b.title,
        isbn: b.isbn || "-",
        author: b.author || b.writer || "-",
        category: b.categories && b.categories.length > 0 ? b.categories[0].name : b.category?.name || b.category || "Umum",
        stock: b.available_copies !== undefined ? b.available_copies : b.stock !== undefined ? b.stock : 1,
        status: (b.available_copies !== undefined ? b.available_copies : b.stock) > 0 ? "Tersedia" : "Habis",
        coverColor: b.cover_color || "#385444",
        coverAccent: b.cover_accent || "#426152"
      }));
      setBooksState(mapped);
    }
  }, [booksApiRes]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [printedCount, setPrintedCount] = useState(0);
  const itemsPerPage = 5;

  const filteredData = booksState.filter((buku) =>
    buku.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buku.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buku.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === currentData.length) {
      // If all on current page are selected, deselect them
      setSelectedIds((prev) => prev.filter(id => !currentData.find(b => b.id === id)));
    } else {
      // Select all on current page
      const newSelections = currentData.map(b => b.id).filter(id => !selectedIds.includes(id));
      setSelectedIds((prev) => [...prev, ...newSelections]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    const count = selectedIds.length;
    const afterPrint = () => {
      setPrintedCount(count);
      setShowSuccessModal(true);
      window.removeEventListener("afterprint", afterPrint);
    };
    window.addEventListener("afterprint", afterPrint);
    window.print();
  };

  // Get selected books for print view
  const selectedBooksToPrint = booksState.filter(b => selectedIds.includes(b.id));

  return (
    <>
      <div className="min-h-screen flex flex-col bg-slate-50/50 print:hidden">
        <SiteHeader
          title="Manajemen Data Buku"
          subtitle="Cetak barcode buku sesuai dengan OPAC"
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cetak Barcode Koleksi
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold block leading-none mb-1">Terpilih</span>
                <span className="text-[#99BD4A] font-black text-xl">{String(selectedIds.length).padStart(2, '0')}</span>
                <span className="text-slate-500 font-medium ml-1">Buku</span>
              </div>
              <Button 
                onClick={handlePrint}
                disabled={selectedIds.length === 0}
                className="bg-[#1e293b] hover:bg-slate-800 text-white gap-2 font-semibold h-11 px-6 shadow-sm"
              >
                Cetak Sekarang <Printer className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <span className="text-sm font-semibold text-slate-700 w-10">Cari</span>
              <Input
                type="search"
                className="w-full lg:w-64 bg-white border-slate-200"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <Button variant="secondary" className="bg-slate-500 hover:bg-slate-600 text-white shadow-sm border-none" onClick={() => setSelectedIds(booksState.map(b => b.id))}>
                Pilih Semua
              </Button>
              <Button variant="secondary" className="bg-slate-500 hover:bg-slate-600 text-white shadow-sm border-none" onClick={() => setSelectedIds([])}>
                Batal Pilih
              </Button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-[#f0f9ff] text-slate-600 text-sm p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              Maximum <span className="text-red-500 font-bold">50</span> records can be printed at once. Currently there is <span className="text-red-500 font-bold">{totalItems}</span> in queue waiting to be printed.
            </div>
          </div>



          {/* Table */}
          <Card className="shadow-sm border-slate-100 overflow-hidden">
            <div className="overflow-x-auto smooth-scrollbar">
              <Table>
                <TableHeader className="bg-white border-b border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center h-14">
                      <Checkbox 
                        checked={currentData.length > 0 && selectedIds.length > 0 && currentData.every(b => selectedIds.includes(b.id))}
                        onCheckedChange={toggleSelectAll}
                        className="border-slate-300 data-[state=checked]:bg-[#99BD4A] data-[state=checked]:border-[#99BD4A]"
                      />
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase">KODE ITEM</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase">JUDUL BUKU</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase">PENULIS</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] tracking-wider uppercase text-right">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((buku) => {
                    const isSelected = selectedIds.includes(buku.id);
                    return (
                      <TableRow
                        key={buku.id}
                        className="hover:bg-slate-50/50 border-b border-slate-100/60"
                      >
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(buku.id)}
                            className="border-slate-300 data-[state=checked]:bg-[#99BD4A] data-[state=checked]:border-[#99BD4A]"
                          />
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {buku.book_code}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-sm">
                            {buku.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium italic mt-0.5">
                            {buku.author}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium text-sm">
                          {buku.author}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Menampilkan {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} data dalam antrean
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 border-slate-200"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {generatePagination(currentPage, totalPages).map((page, i) => (
                  <Button
                    key={i}
                    variant={page === '...' ? "ghost" : currentPage === page ? "default" : "outline"}
                    size="sm"
                    disabled={page === '...'}
                    className={`w-8 h-8 ${
                      page === '...'
                        ? "cursor-default border-none hover:bg-transparent"
                        : currentPage === page
                        ? "bg-[#99BD4A] hover:bg-[#99BD4A]/80 text-white border-none"
                        : ""
                    }`}
                    onClick={() => {
                      if (page !== '...') setCurrentPage(page as number);
                    }}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 border-slate-200"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>

      {/* ── PRINT VIEW (Only visible when printing) ── */}
      <div className="hidden print:block p-8 bg-white min-h-screen">
        <h1 className="text-xl font-bold mb-8 pb-4 border-b">Item Barcode Label Print Result</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {selectedBooksToPrint.map((buku) => (
            <div key={buku.id} className="border-2 border-black p-4 text-center rounded bg-white w-[260px] h-[150px] flex flex-col justify-center items-center relative overflow-hidden">
              <div className="font-extrabold text-lg uppercase tracking-widest text-black mb-1">RKWK</div>
              <div className="text-xs text-black italic mb-3 px-2 line-clamp-1">{buku.title}</div>
              
              {/* Real Barcode Generation */}
              <div className="flex justify-center items-center h-12 w-full mb-1 overflow-hidden px-2">
                <Barcode 
                  value={buku.book_code && buku.book_code !== "-" ? buku.book_code : buku.id} 
                  width={1.5} 
                  height={40} 
                  displayValue={false} 
                  background="transparent"
                  margin={0}
                />
              </div>
              
              <div className="font-mono font-bold tracking-[0.3em] text-sm text-black">
                {buku.book_code && buku.book_code !== "-" ? buku.book_code : buku.id}
              </div>
            </div>
          ))}
          
          {selectedBooksToPrint.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 py-10 text-lg">
              Tidak ada buku yang dipilih untuk dicetak.
            </div>
          )}
        </div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSuccessModal(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-[#f0fdf4] flex items-center justify-center mb-5 ring-8 ring-[#dcfce7]">
              <CheckCircle2 className="w-10 h-10 text-[#22c55e]" strokeWidth={1.8} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-slate-900 mb-1">Cetak Berhasil!</h2>
            <p className="text-slate-500 text-sm mb-6">
              <span className="font-bold text-[#99BD4A] text-lg">{printedCount}</span> barcode buku berhasil dikirim ke printer.
            </p>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedIds([]);
                }}
              >
                Bersihkan Pilihan
              </Button>
              <Button
                className="flex-1 bg-[#1e293b] hover:bg-slate-800 text-white"
                onClick={() => setShowSuccessModal(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
