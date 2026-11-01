"use client";

import { useEffect } from "react";
import { useHublyStore } from "@/lib/store";

const CHECK_MS = 30_000;

/** Revisa los mensajes programados y recordatorios mientras la app esté abierta, en cualquier pantalla. */
export function ChatQueueRunner() {
  const flush = useHublyStore((s) => s.flushChatQueue);
  useEffect(() => {
    flush(Date.now());
    const timer = window.setInterval(() => flush(Date.now()), CHECK_MS);
    return () => window.clearInterval(timer);
  }, [flush]);
  return null;
}
