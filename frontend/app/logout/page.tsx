"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutApp() {
  const router = useRouter();

  useEffect(() => {
    localStorage.clear();
    router.replace("/login");
  }, [router]);

  return (
    <main
      className="
        min-h-screen
        flex items-center justify-center
        bg-gradient-to-br from-blue-50 via-white to-indigo-100
      "
    >
      <p className="text-lg font-medium text-gray-700">Logging&nbsp;out…</p>
    </main>
  );
}
