"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface ConnectResponse {
  message: string;
  phone_code_hash: string;
}

interface VerifyResponse {
  message: string;
}

interface VerifyPayload {
  phone: string;
  code: string;
  password?: string;
}

export default function ConnectTelegramPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"phone" | "code" | "password">("phone");
  const [msg, setMsg] = useState("");

  const sendPhone = async () => {
    try {
      const { data } = await axios.post<ConnectResponse>(
        "http://localhost:8000/telegram/connect",
        { phone }
      );
      setMsg(data.message);
      setStep("code");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = (error as AxiosError<{ detail?: string }>).response?.data
          .detail;
        setMsg(detail ?? "Error connecting");
      } else {
        setMsg("Error connecting");
      }
    }
  };

  const verifyCode = async () => {
    try {
      const payload: VerifyPayload = { phone, code };
      const { data } = await axios.post<VerifyResponse>(
        "http://localhost:8000/telegram/verify",
        payload
      );
      setMsg(data.message);
      router.push("/telegram/chats");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detailData = (error as AxiosError<{ detail?: string }>).response
          ?.data.detail;
        if (detailData === "Two-step verification required") {
          setMsg(detailData);
          setStep("password");
        } else {
          setMsg(detailData ? detailData : "Error verifying code");
        }
      } else {
        setMsg("Error verifying code");
      }
    }
  };

  const verifyPassword = async () => {
    try {
      const { data } = await axios.post<VerifyResponse>(
        "http://localhost:8000/telegram/verify",
        { phone, password }
      );
      setMsg(data.message);
      router.push("/telegram/chats");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = (error as AxiosError<{ detail?: string }>).response?.data
          .detail;
        setMsg(detail ?? "Error verifying password");
      } else {
        setMsg("Error verifying password");
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-3xl">
        <CardHeader className="flex flex-col items-center gap-3 pt-8">
          <PaperAirplaneIcon className="h-14 w-14 text-indigo-500 animate-fly" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 text-center">
            Connect Telegram
          </h1>
        </CardHeader>

        <CardBody className="px-8 pt-4 pb-0">
          {step === "phone" && (
            <input
              type="text"
              placeholder="+380..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
          {step === "code" && (
            <input
              type="text"
              placeholder="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
          {step === "password" && (
            <input
              type="password"
              placeholder="2FA Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
          {msg && (
            <p className="mt-3 text-center text-sm text-red-600">{msg}</p>
          )}
        </CardBody>

        <CardFooter className="flex flex-col gap-4 px-8 pb-8 mt-4">
          {step === "phone" && (
            <Button
              fullWidth
              color="primary"
              size="lg"
              radius="lg"
              variant="solid"
              onPress={sendPhone}
              className="
              py-2 mt-1
              relative overflow-hidden
              font-semibold text-white
              bg-indigo-600 shadow-2xl
              rounded-full
              transition-all duration-200
              hover:bg-indigo-700 hover:shadow-2xl/80
              cursor-pointer
            "
            >
              Send Code
            </Button>
          )}
          {step === "code" && (
            <Button
              fullWidth
              color="primary"
              size="lg"
              radius="lg"
              variant="solid"
              onPress={verifyCode}
              className="
              py-2 mt-1
              relative overflow-hidden
              font-semibold text-white
              bg-indigo-600 shadow-2xl
              rounded-full
              transition-all duration-200
              hover:bg-indigo-700 hover:shadow-2xl/80
              cursor-pointer
            "
            >
              Verify Code
            </Button>
          )}
          {step === "password" && (
            <Button
              fullWidth
              color="primary"
              size="lg"
              radius="lg"
              variant="solid"
              onPress={verifyPassword}
              className="
              py-2 mt-1
              relative overflow-hidden
              font-semibold text-white
              bg-indigo-600 shadow-2xl
              rounded-full
              transition-all duration-200
              hover:bg-indigo-700 hover:shadow-2xl/80
              cursor-pointer
            "
            >
              Submit Password
            </Button>
          )}
          <Link
            href="/login"
            className="text-center text-indigo-600 hover:underline"
          >
            Back to Log In
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
