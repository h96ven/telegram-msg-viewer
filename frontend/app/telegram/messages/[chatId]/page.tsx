"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Button } from "@heroui/react";

/* -------- тип повідомлення -------- */
interface Msg {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_photo: string; // можна й не використовувати
  text: string;
  date: string;
}

/* -------- універсальний клас кнопки пагінатора -------- */
const pagerBtn = `
  flex items-center justify-center
  h-10 min-w-[48px] px-3 rounded-lg
  bg-indigo-600 text-white text-sm font-semibold
  shadow transition hover:bg-indigo-700 active:scale-95
  disabled:opacity-40 disabled:pointer-events-none
`;

export default function Messages() {
  const { chatId } = useParams<{ chatId: string }>();
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("phone") ?? "" : "";

  /* ---------- state ---------- */
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [myId, setMyId] = useState<string>(""); // ← ЗБЕРІГАЄМО як STRING

  const bottomRef = useRef<HTMLDivElement>(null);

  /* зчитуємо my_id один раз після mount */
  useEffect(() => {
    if (typeof window !== "undefined")
      setMyId(localStorage.getItem("my_id") ?? "");
  }, []);

  /* завантаження чергової сторінки */
  useEffect(() => {
    if (!phone) return;
    setLoading(true);

    (async () => {
      const { data } = await axios.get(
        `http://localhost:8000/telegram/messages/${chatId}` +
          `?phone=${encodeURIComponent(phone)}&page=${page}&size=${PAGE_SIZE}`
      );

      setPages(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
      setMsgs(data.messages);
      setLoading(false);
    })();
  }, [phone, chatId, page]);

  /* автоскрол у кінець */
  useEffect(() => bottomRef.current?.scrollIntoView(), [msgs]);

  /* ---------- JSX ---------- */
  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* пагінатор */}
      <header className="flex items-center justify-center gap-2 p-3 bg-white shadow">
        <Button
          className={pagerBtn}
          isDisabled={page >= pages}
          onPress={() => setPage(pages)}
        >
          First
        </Button>
        <Button
          className={pagerBtn}
          isDisabled={page >= pages}
          onPress={() => setPage((p) => p + 1)}
        >
          ▲
        </Button>

        <span className="text-sm font-medium">
          {pages - page + 1}/{pages}
        </span>

        <Button
          className={pagerBtn}
          isDisabled={page <= 1}
          onPress={() => setPage((p) => p - 1)}
        >
          ▼
        </Button>
        <Button
          className={pagerBtn}
          isDisabled={page <= 1}
          onPress={() => setPage(1)}
        >
          Last
        </Button>
      </header>

      {/* стрічка */}
      <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* skeleton */}
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-1/2 mx-auto bg-indigo-100/70 rounded animate-pulse"
            />
          ))}

        {/* повідомлення */}
        {!loading &&
          msgs.map((m) => {
            const mine = String(m.sender_id) === myId;
            return (
              <div key={m.id} className="w-full flex justify-center">
                <div
                  className={`
                  flex flex-col items-${mine ? "end" : "start"}
                  max-w-[30%] w-fit break-words
                  px-4 py-3 rounded-2xl shadow
                  ${
                    mine
                      ? "bg-indigo-500 text-white"
                      : "bg-white text-gray-900 border border-gray-300"
                  }
                `}
                  title={new Date(m.date).toLocaleString()}
                >
                  {/* ім'я автора показуємо лише для чужих повідомлень */}
                  {!mine && (
                    <span className="text-[11px] font-semibold text-gray-500 mb-1">
                      {m.sender_name}
                    </span>
                  )}

                  {m.text || <i className="opacity-60">(no text)</i>}
                </div>
              </div>
            );
          })}

        <div ref={bottomRef} />
      </section>
    </main>
  );
}
