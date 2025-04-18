"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Button } from "@heroui/react";

interface Msg {
  id: number;
  sender_id: number;
  text: string;
  date: string;
}

const btn = `
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

  /* state */
  const pageSize = 30;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [myId, setMyId] = useState<number>(0);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* my id */
  useEffect(() => {
    if (typeof window !== "undefined")
      setMyId(Number(localStorage.getItem("my_id") ?? 0));
  }, []);

  /* load messages */
  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    (async () => {
      const { data } = await axios.get(
        `http://localhost:8000/telegram/messages/${chatId}` +
          `?phone=${encodeURIComponent(phone)}&page=${page}&size=${pageSize}`
      );
      setTotalPages(Math.max(1, Math.ceil(data.total / pageSize)));
      setMsgs(data.messages);
      setLoading(false);
    })();
  }, [phone, chatId, page]);

  /* scroll‑bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [msgs]);

  /* ============================= JSX ============================ */
  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* пагінація угорі */}
      <header className="flex items-center justify-center gap-2 p-3 bg-white shadow">
        <Button
          className={btn}
          isDisabled={page >= totalPages}
          onPress={() => setPage(totalPages)}
        >
          First
        </Button>
        <Button
          className={btn}
          isDisabled={page >= totalPages}
          onPress={() => setPage((p) => p + 1)}
        >
          ▲
        </Button>
        <span className="text-sm font-medium">
          {totalPages - page + 1} / {totalPages}
        </span>
        <Button
          className={btn}
          isDisabled={page <= 1}
          onPress={() => setPage((p) => p - 1)}
        >
          ▼
        </Button>
        <Button
          className={btn}
          isDisabled={page <= 1}
          onPress={() => setPage(1)}
        >
          Last
        </Button>
      </header>

      {/* стрічка */}
      <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* скелет */}
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
            const mine = m.sender_id === myId;
            return (
              <div key={m.id} className="w-full flex justify-center">
                <div
                  className={`
                    w-fit max-w-[30%] break-words
                    px-4 py-3 rounded-2xl shadow
                    ${mine ? "bg-indigo-500 text-white" : "bg-white"}
                  `}
                  title={new Date(m.date).toLocaleString()}
                >
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
