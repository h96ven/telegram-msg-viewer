"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LogoutTelegram() {
  const router = useRouter();
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("phone") : "";

  useEffect(() => {
    if (!phone) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        await axios.post("http://localhost:8000/telegram/logout", null, {
          params: { phone },
        });
      } catch (err) {
        console.error(err);
      } finally {
        localStorage.removeItem("phone");
        router.replace("/login");
      }
    })();
  }, [phone, router]);

  <p className="p-6">Logging out of Telegram…</p>;
}
