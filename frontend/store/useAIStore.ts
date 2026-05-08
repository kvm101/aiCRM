import { create } from 'zustand';

export interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIStore {
  isOpen: boolean;
  messages: AIMessage[];
  isGenerating: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setGenerating: (isGenerating: boolean) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  isOpen: false,
  messages: [],
  isGenerating: false,
  
  setIsOpen: (isOpen) => set({ isOpen }),
  
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  
  addMessage: (msg) => set((state) => ({
    messages: [
      ...state.messages,
      {
        ...msg,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date()
      }
    ]
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
