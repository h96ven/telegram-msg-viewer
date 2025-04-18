"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { ChatBubbleOvalLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";

interface Chat {
  id: string;
  name: string;
  photo?: string;
}

const pagerBtn = `
  flex items-center justify-center
  h-12 min-w-[56px] px-4 rounded-xl
  bg-indigo-500 text-white font-bold shadow-lg
  transition hover:bg-indigo-700 hover:shadow-xl active:scale-95
  disabled:opacity-40 disabled:pointer-events-none
`;

const logoutBtn = `
  inline-flex items-center gap-1
  px-3 py-2 rounded-lg text-xs font-semibold
  bg-gray-400 text-white shadow hover:bg-gray-600
`;

export default function Chats() {
  const PAGE_SIZE = 20;
  const phone =
    typeof window !== "undefined"
      ? localStorage.getItem("phone")?.trim() ?? ""
      : "";

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const initials = (n = "") =>
    n
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    setChats([]);

    (async () => {
      const { data } = await axios.get(
        `http://localhost:8000/telegram/chats?phone=${encodeURIComponent(
          phone
        )}&page=${page}&size=${PAGE_SIZE}`
      );

      setTotal(data.total);
      setChats(data.chats.map((c: Chat) => ({ ...c, photo: undefined })));

      data.chats.forEach(async (c: Chat) => {
        try {
          const { data: p } = await axios.get(
            `http://localhost:8000/telegram/chat_photo/${
              c.id
            }?phone=${encodeURIComponent(phone)}`
          );
          setChats((prev) =>
            prev.map((ch) =>
              ch.id === c.id ? { ...ch, photo: p.photo ?? "" } : ch
            )
          );
        } catch {
          /* ignore */
        }
      });

      setLoading(false);
    })();
  }, [phone, page]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <header className="relative w-full px-6 py-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Chats</h2>

        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
          <Link href="/telegram/logout" className={logoutBtn}>
            Logout TG
          </Link>
          <Link href="/logout" className={logoutBtn}>
            Logout
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md flex flex-col items-center px-6">
        <div className="relative w-full space-y-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl z-10">
              <svg
                className="animate-spin h-12 w-12 text-indigo-600"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          )}

          {loading &&
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse bg-indigo-100/80 px-4"
              />
            ))}

          {!loading &&
            chats.map((c) => (
              <Link
                key={c.id}
                href={`/telegram/messages/${c.id}`}
                className="block bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 hover:bg-white transition"
              >
                <div className="flex items-center gap-4">
                  {c.photo === undefined ? (
                    <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                  ) : c.photo ? (
                    <Image
                      src={c.photo}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-lg">
                      {initials(c.name)}
                    </div>
                  )}
                  <span className="flex-1 font-medium text-gray-800 truncate">
                    {c.name}
                  </span>
                  <ChatBubbleOvalLeftIcon className="h-5 w-5 text-indigo-400" />
                </div>
              </Link>
            ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            className={pagerBtn}
            isDisabled={page === 1}
            onPress={() => setPage(1)}
          >
            First
          </Button>
          <Button
            className={pagerBtn}
            isDisabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="px-3 py-2 text-sm font-medium">
            {page}/{totalPages}
          </span>
          <Button
            className={pagerBtn}
            isDisabled={page === totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
          <Button
            className={pagerBtn}
            isDisabled={page === totalPages}
            onPress={() => setPage(totalPages)}
          >
            Last
          </Button>
        </div>
      </div>
    </main>
  );
}
