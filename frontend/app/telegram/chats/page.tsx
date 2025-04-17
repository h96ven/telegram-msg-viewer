"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

export default function Chats() {
  interface Chat {
    id: string;
    name?: string;
  }

  const [chats, setChats] = useState<Chat[]>([]);
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("phone") : "";

  useEffect(() => {
    if (!phone) return;
    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:8000/telegram/chats?phone=${phone}`
        );
        setChats(data.chats);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [phone]);

  return (
    <main className="p-6">
      <h2 className="text-xl font-semibold mb-4">Chats</h2>
      <ul className="space-y-2">
        {chats.map((c) => (
          <li key={c.id}>
            <Link href={`/telegram/messages/${c.id}`} className="underline">
              {c.name || "Untitled"}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
