"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

interface Msg {
  id: number;
  sender_id: number;
  text: string;
  date: string;
}

export default function Messages() {
  const params = useParams<{ chatId: string }>();
  const chatId = params.chatId;
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("phone") : "";
  const [messages, setMessages] = useState<Msg[]>([]);

  useEffect(() => {
    if (!phone) return;
    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:8000/telegram/messages/${chatId}` +
            `?phone=${encodeURIComponent(phone)}`
        );
        setMessages(data.messages);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [chatId, phone]);

  return (
    <main className="p-6">
      <h2 className="text-xl font-semibold mb-4">Messages</h2>
      <ul className="space-y-2">
        {messages.map((m) => (
          <li key={m.id}>
            <span className="font-semibold">{m.sender_id}</span>: {m.text}
          </li>
        ))}
      </ul>
    </main>
  );
}
