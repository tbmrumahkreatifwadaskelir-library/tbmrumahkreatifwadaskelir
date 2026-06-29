"use client";

import { useEffect, useState } from "react";

export default function UserInfo({
  name,
}: {
  name: string | null | undefined;
}) {
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Format: 3 Agustus 2025 09.32 (tanpa detik)
      const formatted = now.toLocaleString("id-ID", {
        day: "numeric",
        month: "long", // <-- bikin jadi Agustus, September, dst.
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60 * 1000); // update tiap menit
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex flex-col">
      <h1 className="font-semibold">{name}</h1>
      <p className="hidden md:flex text-xs text-gray-500">{dateTime}</p>
    </div>
  );
}
