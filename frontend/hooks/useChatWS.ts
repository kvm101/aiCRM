import { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
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
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  return useQuery({
    queryKey: ['chats', activeProjectId],
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
      // session is @JsonIgnore on backend, so use chatId from query context
      return data.map((msg: any) => ({
        id: msg.id,
        chatId: chatId, // use known chatId since session is hidden
        sender: msg.senderType === 'OPERATOR' ? 'user' : 'client',
        senderType: msg.senderType,
        text: msg.text,
        timestamp: msg.createdAt,
      }));
    },
    enabled: !!chatId,
    refetchInterval: false,
    staleTime: 0,
  });
};

export function useChatWS() {
  const queryClient = useQueryClient();
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ chatId, text }: { chatId: string | number, text: string }) => {
      const { data } = await apiClient.post(`/chats/${chatId}/messages`, { text }, { withCredentials: true });
      return data;
    },
    onMutate: async ({ chatId, text }) => {
      // Optimistic update: show message immediately
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        chatId,
        sender: 'user',
        text,
        timestamp: new Date().toISOString(),
      };
      setLiveMessages(prev => [...prev, optimistic]);
    },
    onSuccess: (savedMsg, variables) => {
      // Remove optimistic message (real one will appear via query invalidation)
      setLiveMessages(prev => prev.filter(m => !String(m.id).startsWith('optimistic-')));
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: () => {
      setLiveMessages(prev => prev.filter(m => !String(m.id).startsWith('optimistic-')));
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

export const useRenameChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, clientName }: { chatId: number; clientName: string }) => {
      const { data } = await apiClient.patch(`/chats/${chatId}/rename`, { clientName }, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });
};
