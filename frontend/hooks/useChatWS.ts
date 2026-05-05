import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export type ChatMessage = {
  id: string;
  chatId: string;
  sender: "user" | "client";
  text: string;
  timestamp: string;
};

export type WSEvent = 
  | { type: "NEW_MESSAGE"; payload: ChatMessage }
  | { type: "CHAT_ASSIGNED"; payload: { chatId: string; assignedTo: string } };

export function useChatWS(wsUrl: string = "ws://localhost:8080/ws/chats") {
  const { currentUser } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket with User ID as query param (for backend assignment logic)
    const ws = new WebSocket(`${wsUrl}?userId=${currentUser.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WebSocket] Connected as ${currentUser.name}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSEvent;
        console.log("[WebSocket] Received:", data);

        if (data.type === "NEW_MESSAGE") {
          setMessages((prev) => [...prev, data.payload]);
        }
      } catch (e) {
        console.error("[WebSocket] Parse error:", e);
      }
    };

    ws.onclose = () => {
      console.log("[WebSocket] Disconnected");
    };

    return () => {
      ws.close();
    };
  }, [wsUrl, currentUser.id, currentUser.name]);

  const sendMessage = (chatId: string, text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const msg: WSEvent = {
        type: "NEW_MESSAGE",
        payload: {
          id: Date.now().toString(),
          chatId,
          sender: "user",
          text,
          timestamp: new Date().toISOString(),
        },
      };
      // Optimistic update
      setMessages((prev) => [...prev, msg.payload]);
      // The backend will probably ignore the ID/Timestamp and generate its own, but we send it for now.
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  return { messages, sendMessage };
}
