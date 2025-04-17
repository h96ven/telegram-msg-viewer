"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ConnectTelegram() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [msg, setMsg] = useState("");

  const sendPhone = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:8000/telegram/connect",
        { phone }
      );
      setMsg(data.message);
      localStorage.setItem("phone", phone);
      setStep("code");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setMsg(err.response.data?.detail ?? "Error");
      } else {
        setMsg("Error");
      }
    }
  };

  const verify = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:8000/telegram/verify",
        { phone, code }
      );
      setMsg(data.message);
      router.push("/telegram/chats");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setMsg(err.response.data?.detail ?? "Error");
      } else {
        setMsg("Error");
      }
    }
  };

  return (
    <main className="flex flex-col items-center gap-2 p-6">
      <h2 className="text-2xl font-semibold">Connect Telegram</h2>

      {step === "phone" && (
        <>
          <input
            className="border p-2"
            placeholder="+380..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white"
            onClick={sendPhone}
          >
            Send Code
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <input
            className="border p-2"
            placeholder="Код"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-green-600 text-white"
            onClick={verify}
          >
            Verify
          </button>
        </>
      )}

      <p>{msg}</p>
    </main>
  );
}
