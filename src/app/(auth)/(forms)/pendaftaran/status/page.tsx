"use client";

import { Suspense } from "react";
import RegistrationStatusContent from "./status-content";

export default function RegistrationStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#99BD4A] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Memuat status pendaftaran...</p>
          </div>
        </div>
      }
    >
      <RegistrationStatusContent />
    </Suspense>
  );
}
