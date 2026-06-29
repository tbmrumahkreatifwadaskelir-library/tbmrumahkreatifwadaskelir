"use client";

import { useEffect, useState } from "react";
import { StatusModal } from "@/components/ui/status-modal";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SessionExpirationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  const handleAction = async () => {
    await signOut({ redirect: false });
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <StatusModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // If they close it, we still force them out since they are unauthorized
          handleAction();
        }
      }}
      status="failed"
      title="Sesi Anda Berakhir"
      description="Sesi login Anda telah berakhir atau tidak valid (Error 401). Anda harus masuk kembali untuk melanjutkan akses ke halaman Admin."
      actionLabel="Masuk Kembali"
      onAction={handleAction}
    />
  );
}
