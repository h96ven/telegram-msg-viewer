"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    localStorage.clear();
    router.replace("/login");
  }, [router]);

 <p className="p-6">Logging out…</p>;
}
