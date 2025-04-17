"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    try {
      const { data } = await axios.post("http://localhost:8000/auth/login", {
        username,
        password,
      });
      localStorage.setItem("username", data.username);
      setMsg(data.message);
      router.push("/telegram/connect");
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
      <h2 className="text-2xl font-semibold">Вхід</h2>
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
        className="px-4 py-2 bg-green-600 text-white"
        onClick={handleLogin}
      >
        Log In
      </button>
      <p>{msg}</p>
    </main>
  );
}
