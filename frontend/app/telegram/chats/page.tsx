"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import ChatBubbleOvalLeftIcon from "@heroicons/react/24/solid/ChatBubbleOvalLeftIcon";

interface Chat {
  id: string;
  name?: string;
  photo?: string;
}

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("phone")?.trim() : "";

  useEffect(() => {
    if (!phone) return;
    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:8000/telegram/chats?phone=${encodeURIComponent(
            phone
          )}`
        );

        const chatsWithPhoto: Chat[] = await Promise.all(
          data.chats.map(async (c: Chat) => {
            try {
              const res = await axios.get(
                `http://localhost:8000/telegram/chat_photo/${
                  c.id
                }?phone=${encodeURIComponent(phone)}`
              );
              return { ...c, photo: res.data.photo };
            } catch {
              return { ...c, photo: "" };
            }
          })
        );

        setChats(chatsWithPhoto);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [phone]);

  const initials = (name = "") =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Chats
        </h2>

        {chats.map((c) => (
          <Link
            key={c.id}
            href={`/telegram/messages/${c.id}`}
            className="block bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 hover:bg-white/90 transition"
          >
            <div className="flex items-center gap-4">
              {c.photo ? (
                <Image
                  src={c.photo}
                  alt="avatar"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover border"
                />
              ) : (
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-lg">
                  {initials(c.name || "U")}
                </div>
              )}

              <span className="flex-1 font-medium text-gray-800 truncate">
                {c.name || "Untitled"}
              </span>

              <ChatBubbleOvalLeftIcon className="h-5 w-5 text-indigo-400" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
