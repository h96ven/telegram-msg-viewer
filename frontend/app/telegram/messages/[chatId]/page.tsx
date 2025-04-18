"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Button } from "@heroui/react";

/* --- бек‑ендова форма повідомлення --- */
interface Msg {
  id: number;
  sender_id: number;
  sender_name: string;
  text: string;
  date: string;
}

/* --- стиль кнопок --- */
const pagerBtn = `
  flex items-center justify-center
  h-10 min-w-[48px] px-3 rounded-lg
  bg-indigo-600 text-white text-sm font-semibold
  shadow transition hover:bg-indigo-700 active:scale-95
  disabled:opacity-40 disabled:pointer-events-none
`;

export default function Messages() {
  const PAGE_SIZE = 30;
  const { chatId } = useParams<{ chatId: string }>();
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("phone") ?? "" : "";

  /* state */
  const [page, setPage] = useState(0); // 0 – самий кінець
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoad] = useState(true);
  const [hasNext, setNext] = useState(false); // ▲ (старіші)
  const [hasPrev, setPrev] = useState(false); // ▼ (новіші)
  const [myId, setMyId] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);

  /* зчитуємо my_id один раз */
  useEffect(() => setMyId(localStorage.getItem("my_id") ?? ""), []);

  /* запит порції */
  useEffect(() => {
    if (!phone) return;
    setLoad(true);

    (async () => {
      const { data } = await axios.get(
        `http://localhost:8000/telegram/messages/${chatId}` +
          `?phone=${encodeURIComponent(phone)}&page=${page}&size=${PAGE_SIZE}`
      );

      setMsgs(data.messages.reverse()); // показуємо знизу‑вгору
      setNext(data.has_next);
      setPrev(data.has_prev);
      setLoad(false);
    })();
  }, [phone, chatId, page]);

  /* автоскрол у кінець (найновіше) */
  useEffect(
    () => bottomRef.current?.scrollIntoView({ behavior: "auto" }),
    [msgs]
  );

  /* --- JSX --- */
  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* ПАГІНАТОР */}
      <header className="flex items-center justify-center gap-3 p-3 bg-white shadow">
        {/* до кінця */}
        <Button
          className={pagerBtn}
          isDisabled={page === 0}
          onPress={() => setPage(0)}
        >
          Last
        </Button>

        {/* ↓ новіші */}
        <Button
          className={pagerBtn}
          isDisabled={!hasPrev}
          onPress={() => setPage((p) => Math.max(0, p - 1))}
        >
          ▼
        </Button>

        {/* ↑ старіші */}
        <Button
          className={pagerBtn}
          isDisabled={!hasNext}
          onPress={() => setPage((p) => p + 1)}
        >
          ▲
        </Button>
      </header>

      {/* СТРІЧКА */}
      <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* скелет */}
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-1/2 mx-auto bg-indigo-100/70 rounded animate-pulse"
            />
          ))}

        {/* меседжі */}
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
