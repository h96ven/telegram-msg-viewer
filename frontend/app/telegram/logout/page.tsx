"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LogoutTelegram() {
  const router = useRouter();

  useEffect(() => {
    const phone = localStorage.getItem("phone")?.trim();
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
        // phone залишаємо, щоб можна було швидко під’єднатися знову
        router.replace("/telegram/connect");
      }
    })();
  }, [router]);

  /* ---------------- JSX ---------------- */
  return (
    <main
      className="
      min-h-screen                       /* висота на весь екран           */
      flex items-center justify-center   /* центруємо по вертикалі й горизонталі */
      bg-gradient-to-br from-blue-50 via-white to-indigo-100
    "
    >
      <p className="text-lg font-medium text-gray-700">
        Logging&nbsp;out&nbsp;of&nbsp;Telegram…
      </p>
    </main>
  );
}
