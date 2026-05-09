"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";

const WS_URL = "ws://localhost:8080/ws/chats";

/**
 * GlobalWSProvider — підключається до WebSocket ОДИН РАЗ на рівні Layout.
 * Обробляє всі real-time події:
 *   - NEW_MESSAGE       → оновлює список чатів і повідомлень
 *   - NEW_NOTIFICATION  → миттєво оновлює дзвоник у хедері
 */
export function GlobalWSProvider() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const ws = new WebSocket(`${WS_URL}?userId=${currentUser.id}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[GlobalWS] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "NEW_MESSAGE") {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          }

          if (data.type === "NEW_NOTIFICATION") {
            // Миттєво оновлюємо дзвоник у хедері на будь-якій сторінці
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        } catch (e) {
          console.error("[GlobalWS] Parse error:", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("[GlobalWS] Error:", err);
      };

      ws.onclose = () => {
        console.log("[GlobalWS] Disconnected — reconnecting in 3s...");
        if (isMounted) {
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [currentUser.id, queryClient]);

  // Цей компонент нічого не рендерить — він тільки слухає WS
  return null;
}
