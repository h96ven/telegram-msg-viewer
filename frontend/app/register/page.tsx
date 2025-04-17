"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async () => {
    try {
      const { data } = await axios.post("http://localhost:8000/auth/register", {
        username,
        password,
      });
      setMsg(data.message);
      router.push("/login");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setMsg(err.response.data.detail);
      } else {
        setMsg("Error");
      }
    }
  };

  return (
    <main className="flex flex-col items-center gap-2 p-6">
      <h2 className="text-2xl font-semibold">Реєстрація</h2>
      <input
        className="border p-2"
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="border p-2"
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="px-4 py-2 bg-blue-600 text-white"
        onClick={handleRegister}
      >
        Sign Up
      </button>
      <p>{msg}</p>
    </main>
  );
}
