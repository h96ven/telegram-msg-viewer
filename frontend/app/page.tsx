"use client";

import Link from "next/link";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-3xl">
        <CardHeader className="flex flex-col items-center gap-3 pt-8">
          <PaperAirplaneIcon className="h-14 w-14 text-indigo-500 animate-fly" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 text-center">
            Telegram Message Viewer
          </h1>
        </CardHeader>

        <CardBody className="px-8 pt-4 pb-0">
          <p className="text-center text-gray-600 leading-relaxed text-base">
            View chats and messages from your Telegram account directly in your
            browser — fast and secure.
          </p>
        </CardBody>

        <CardFooter className="flex flex-col gap-4 px-8 pb-8 mt-6">
          <Link href="/register" className="w-full">
            <Button
              fullWidth
              color="primary"
              size="lg"
              radius="lg"
              variant="solid"
              className="
                relative overflow-hidden
                font-semibold text-white bg-indigo-600
                shadow-2xl rounded-full
                transition-all duration-200
                hover:bg-indigo-700 hover:shadow-2xl/80
                cursor-pointer
                py-2
              "
            >
              Sign Up
            </Button>
          </Link>

          <Link href="/login" className="w-full">
            <Button
              fullWidth
              color="primary"
              size="lg"
              radius="lg"
              variant="bordered"
              className="
                font-semibold
                text-indigo-600
                border-2 border-indigo-600
                bg-white
                shadow-md rounded-full
                transition-all duration-200
                hover:bg-indigo-50 hover:border-indigo-700 hover:shadow-lg
                cursor-pointer
                py-2
              "
            >
              Log In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
