"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export default function RegisterPage() {
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
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-3xl">
        <CardHeader className="flex flex-col items-center gap-3 pt-8">
          <PaperAirplaneIcon className="h-14 w-14 text-indigo-500 animate-fly" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 text-center">
            Sign Up
          </h1>
        </CardHeader>

        <CardBody className="px-8 pt-4 pb-0">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {msg && (
            <p className="mt-3 text-center text-sm text-red-600">{msg}</p>
          )}
        </CardBody>

        <CardFooter className="flex flex-col gap-4 px-8 pb-8 mt-4">
          <Button
            fullWidth
            color="primary"
            size="lg"
            radius="lg"
            variant="solid"
            onPress={handleRegister}
            className="py-2 mt-1 relative overflow-hidden font-semibold text-white bg-indigo-600 shadow-2xl rounded-full transition-all duration-200 hover:bg-indigo-700 hover:shadow-2xl/80 cursor-pointer"
          >
            Sign Up
          </Button>

          <Link
            href="/login"
            className="text-center text-indigo-600 hover:underline"
          >
            Already have an account? Log In
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
