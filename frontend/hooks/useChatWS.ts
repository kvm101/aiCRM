import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";

export type ChatMessage = {
  id: string | number;
  chatId?: string | number;
  senderType?: "OPERATOR" | "CLIENT" | "SYSTEM";
  sender?: "user" | "client"; // kept for backward compatibility with frontend
  text: string;
  createdAt?: string;
  timestamp?: string; // kept for backward compatibility
};

export type ChatSessionType = {
  id: number;
  externalChatId: string;
  clientName: string;
  status: string;
  channelType: string;
  unreadCount: number;
};

export type WSEvent = 
  | { type: "NEW_MESSAGE"; payload: ChatMessage }
  | { type: "CHAT_ASSIGNED"; payload: { chatId: string; assignedTo: string } };

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async (): Promise<ChatSessionType[]> => {
      const { data } = await apiClient.get('/chats', { withCredentials: true });
      return data;
    },
  });
};

export const useChatMessages = (chatId: number | null) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!chatId) return [];
      const { data } = await apiClient.get(`/chats/${chatId}/messages`, { withCredentials: true });
      // Transform backend format to frontend format
      return data.map((msg: any) => ({
        id: msg.id,
        chatId: msg.session?.id || chatId,
        sender: msg.senderType === "OPERATOR" ? "user" : "client",
        text: msg.text,
        timestamp: msg.createdAt,
      }));
    },
    enabled: !!chatId,
  });
};

export function useChatWS(wsUrl: string = "ws://localhost:8080/ws/chats") {
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${wsUrl}?userId=${currentUser.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WebSocket] Connected as ${currentUser.name}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[WebSocket] Received:", data);

        // If backend sends a message, invalidate queries to fetch the latest
        if (data.type === "NEW_MESSAGE" || data.status === "received") {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['chats'] });
          if (data.payload) {
             const payload = data.payload;
             const mappedPayload: ChatMessage = {
               id: payload.id,
               chatId: payload.chatId,
               sender: payload.senderType === "OPERATOR" ? "user" : "client",
               text: payload.text,
               timestamp: payload.createdAt
             };
             setLiveMessages((prev) => [...prev, mappedPayload]);
          }
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
  }, [wsUrl, currentUser.id, currentUser.name, queryClient]);

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ chatId, text }: { chatId: string | number, text: string }) => {
      const { data } = await apiClient.post(`/chats/${chatId}/messages`, { text }, { withCredentials: true });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
    }
  });

  return { liveMessages, sendMessage };
}

export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: number) => {
      await apiClient.delete(`/chats/${chatId}`, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });
}

export const useMarkChatRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: number) => {
      await apiClient.patch(`/chats/${chatId}/read`, {}, { withCredentials: true });
    },
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });
};

export const useCreateTeamChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await apiClient.post('/chats', { title }, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });
};
