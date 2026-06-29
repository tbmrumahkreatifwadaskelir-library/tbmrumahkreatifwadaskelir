"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import KatalogSidebar from "@/components/katalog/katalog-sidebar";
import KatalogHeader from "@/components/katalog/katalog-header";
import KatalogView from "@/components/katalog/katalog-view";

function KatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "semua";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const category = searchParams?.get("category");
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  return (
    <>
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* DDC Sidebar - Full height left */}
      <KatalogSidebar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area - Header and Body on the right */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <KatalogHeader toggleSidebar={() => setIsSidebarOpen(true)} />
        <KatalogView selectedCategory={selectedCategory} />
      </div>
    </>
  );
}

export default function KatalogPage() {
  return (
    <Suspense fallback={<div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <KatalogContent />
    </Suspense>
  );
}
