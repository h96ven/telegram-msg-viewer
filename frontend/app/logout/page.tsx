"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutApp() {
  const router = useRouter();

  useEffect(() => {
    localStorage.clear(); // повністю чистимо
    router.replace("/login"); // редірект на форму логіну
  }, [router]);

  /* ---------- JSX ---------- */
  return (
    <main
      className="
      min-h-screen                       /* висота = екран */
      flex items-center justify-center   /* горизонталь + вертикаль */
      bg-gradient-to-br from-blue-50 via-white to-indigo-100
    "
    >
      <p className="text-lg font-medium text-gray-700">Logging&nbsp;out…</p>
    </main>
  );
}
