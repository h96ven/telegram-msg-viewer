"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Msg {
  id: number;
  sender_id: number;
  sender_name: string;
  text: string;
  date: string;
}

const pagerBtn = `
  flex items-center justify-center
  h-10 min-w-[48px] px-3 rounded-lg
  bg-indigo-600 text-white text-sm font-semibold
  shadow transition hover:bg-indigo-700 active:scale-95
  disabled:opacity-40 disabled:pointer-events-none
`;
const navBtn = `
  inline-flex items-center gap-1
  px-3 py-2 rounded-lg text-xs font-semibold
  bg-gray-400 text-white shadow hover:bg-gray-600
`;

export default function Messages() {
  const PAGE_SIZE = 30;
  const { chatId } = useParams<{ chatId: string }>();
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("phone") ?? "" : "";
  const myId =
    typeof window !== "undefined" ? localStorage.getItem("my_id") ?? "" : "";

  const [page, setPage] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoad] = useState(true);
  const [hasNext, setNext] = useState(false);
  const [hasPrev, setPrev] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!phone) return;
    setLoad(true);

    (async () => {
      const { data } = await axios.get(
        `http://localhost:8000/telegram/messages/${chatId}` +
          `?phone=${encodeURIComponent(phone)}&page=${page}&size=${PAGE_SIZE}`
      );

      setMsgs(data.messages.reverse());
      setNext(data.has_next);
      setPrev(data.has_prev);
      setLoad(false);
    })();
  }, [phone, chatId, page]);

  useEffect(
    () => bottomRef.current?.scrollIntoView({ behavior: "auto" }),
    [msgs]
  );

  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <header className="flex items-center gap-4 px-3 py-2 bg-white shadow">
        <Link href="/telegram/chats" className={navBtn}>
          <ArrowLeftIcon className="h-4 w-4" /> Chats
        </Link>

        <div className="flex-1 flex items-center justify-center gap-2">
          <Button
            className={pagerBtn}
            isDisabled={page === 0}
            onPress={() => setPage(0)}
          >
            Last
          </Button>
          <Button
            className={pagerBtn}
            isDisabled={!hasPrev}
            onPress={() => setPage((p) => Math.max(0, p - 1))}
          >
            ▼
          </Button>
          <Button
            className={pagerBtn}
            isDisabled={!hasNext}
            onPress={() => setPage((p) => p + 1)}
          >
            ▲
          </Button>
        </div>

        <div className="flex gap-2">
          <Link href="/telegram/logout" className={navBtn}>
            Logout TG
          </Link>
          <Link href="/logout" className={navBtn}>
            Logout
          </Link>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-1/2 mx-auto bg-indigo-100/70 rounded animate-pulse"
            />
          ))}

        {!loading &&
          msgs.map((m) => {
            const mine = m.sender_id.toString() === myId;
            return (
              <div key={m.id} className="w-full flex justify-center">
                <div
                  className={`
                  flex flex-col items-${mine ? "end" : "start"}
                  max-w-[30%] break-words w-fit px-4 py-3 rounded-2xl shadow
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
