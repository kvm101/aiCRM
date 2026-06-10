import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';

export interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export type SummaryPeriod = 'day' | 'week' | 'month';

export interface ChatContextMessage {
  sender: string;
  text: string;
  timestamp?: string;
}

export interface PendingToolCallType {
  id: string;
  toolName: string;
  arguments: any;
}

interface AIStore {
  isOpen: boolean;
  messages: AIMessage[];
  isGenerating: boolean;
  isHistoryLoaded: boolean;
  modelProvider: string;
  shouldClear: boolean;
  totalMessages: number;
  pendingToolCall: PendingToolCallType | null;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => Promise<void>;
  setGenerating: (isGenerating: boolean) => void;
  setModelProvider: (provider: string) => void;
  loadHistory: () => Promise<void>;
  requestSummary: (period: SummaryPeriod, userId: string) => Promise<void>;
  analyzeChat: (opts: {
    sessionId: number;
    clientName: string;
    channelType: string;
    externalChatId: string;
    userId: string;
    recentMessages: ChatContextMessage[];
  }) => Promise<void>;
  setPendingToolCall: (call: PendingToolCallType | null) => void;
  approvePendingToolCall: () => Promise<void>;
  rejectPendingToolCall: () => Promise<void>;
}

const PERIOD_LABELS: Record<SummaryPeriod, string> = {
  day: 'день',
  week: 'тиждень',
  month: 'місяць',
};

const makeId = () => Math.random().toString(36).substring(7);

export const useAIStore = create<AIStore>((set, get) => ({
  isOpen: false,
  messages: [],
  isGenerating: false,
  isHistoryLoaded: false,
  modelProvider: 'auto',
  shouldClear: false,
  totalMessages: 0,
  pendingToolCall: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  
  setModelProvider: (provider) => set({ modelProvider: provider }),

  setPendingToolCall: (pendingToolCall) => set({ pendingToolCall }),

  approvePendingToolCall: async () => {
    const { pendingToolCall } = get();
    if (!pendingToolCall) return;
    try {
      await apiClient.post(`/ai/tools/approve/${pendingToolCall.id}`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Failed to approve tool call:", e);
    } finally {
      set({ pendingToolCall: null });
    }
  },

  rejectPendingToolCall: async () => {
    const { pendingToolCall } = get();
    if (!pendingToolCall) return;
    try {
      await apiClient.post(`/ai/tools/reject/${pendingToolCall.id}`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Failed to reject tool call:", e);
    } finally {
      set({ pendingToolCall: null });
    }
  },

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (msg) => set((state) => ({
    messages: [
      ...state.messages,
      { ...msg, id: makeId(), timestamp: new Date() }
    ]
  })),

  // Завантажити історію чату з БД
  loadHistory: async () => {
    if (get().isHistoryLoaded) return;
    try {
      const { data } = await apiClient.get('/ai/history', { withCredentials: true });
      const messages: AIMessage[] = data.map((m: any) => ({
        id: String(m.id),
        role: m.role as 'user' | 'ai',
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
      set({ 
        messages, 
        isHistoryLoaded: true,
        totalMessages: messages.length,
        shouldClear: messages.length >= 20,
      });
    } catch {
      set({ isHistoryLoaded: true });
    }
  },

  // Очистити історію в БД
  clearMessages: async () => {
    try {
      await apiClient.delete('/ai/history', { withCredentials: true });
    } catch {
      // ігноруємо помилку
    }
    set({ messages: [], shouldClear: false, totalMessages: 0 });
  },

  setGenerating: (isGenerating) => set({ isGenerating }),

  requestSummary: async (period, userId) => {
    const label = PERIOD_LABELS[period];

    const now = new Date();
    let since: Date;
    if (period === 'day')   since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    else if (period === 'week')  since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sinceIso = since.toISOString().replace('Z', '').substring(0, 19);

    const prompt =
      `Зроби детальну сумаризацію активності CRM за останній ${label}. ` +
      `Дата початку аналізу: ${sinceIso}. ` +
      `Мій userId = ${userId}. ` +
      `Використай свої інструменти: ` +
      `1) getMessagesSince("${sinceIso}") — вхідні повідомлення від клієнтів; ` +
      `2) getAllTasks(userId) — мої задачі; ` +
      `3) getClients(userId, null) — клієнти; ` +
      `Потім напиши структурований звіт: скільки нових звернень, яка активність по задачах, ` +
      `які угоди були активні, ключові теми з чатів. Відповідай українською.`;

    const historyBefore = get().messages.map((m) => ({ role: m.role, content: m.content }));
    set({ isOpen: true, isGenerating: true });
    get().addMessage({ role: 'user', content: `📊 Сумаризація за ${label}` });

    try {
      const { modelProvider } = get();
      const response = await apiClient.post('/ai/chat', { message: prompt, history: historyBefore, modelProvider }, { withCredentials: true });
      get().addMessage({ role: 'ai', content: response.data.reply });
      
      // Оновлюємо лічильник
      const total = response.data.totalMessages ?? get().messages.length;
      set({ totalMessages: total, shouldClear: response.data.shouldClear ?? total >= 20 });
    } catch {
      get().addMessage({ role: 'ai', content: 'Вибачте, не вдалося отримати сумаризацію.' });
    } finally {
      set({ isGenerating: false });
    }
  },

  analyzeChat: async ({ sessionId, clientName, channelType, externalChatId, userId, recentMessages }) => {
    const historyText = recentMessages
      .slice(-20)
      .map(m => `[${m.sender === 'user' ? 'Оператор' : 'Клієнт'}]: ${m.text}`)
      .join('\n');

    const clientLabel = clientName || externalChatId;

    const userLabel = `📋 Аналіз чату: ${clientLabel}`;
    const prompt =
      `Я зараз переглядаю чат з клієнтом у нашій CRM системі. Ось деталі:\n` +
      `- Ім'я/ID клієнта: ${clientLabel}\n` +
      `- Канал: ${channelType}\n` +
      `- ID сесії в CRM: ${sessionId}\n` +
      `- Мій userId: ${userId}\n\n` +
      `Остання переписка з клієнтом:\n${historyText || '(повідомлень поки немає)'}\n\n` +
      `Будь ласка, проаналізуй цю переписку: визнач потребу клієнта, ` +
      `його настрій, чи є у нього відкриті угоди або задачі (використай інструменти getClients та getOpenChats), ` +
      `і запропонуй як краще відповісти. Відповідай українською.`;

    const historyBefore = get().messages.map((m) => ({ role: m.role, content: m.content }));
    set({ isOpen: true, isGenerating: true });
    get().addMessage({ role: 'user', content: userLabel });

    try {
      const { modelProvider } = get();
      const response = await apiClient.post('/ai/chat', { message: prompt, history: historyBefore, modelProvider }, { withCredentials: true });
      get().addMessage({ role: 'ai', content: response.data.reply });
      
      const total = response.data.totalMessages ?? get().messages.length;
      set({ totalMessages: total, shouldClear: response.data.shouldClear ?? total >= 20 });
    } catch {
      get().addMessage({ role: 'ai', content: 'Вибачте, не вдалося проаналізувати чат.' });
    } finally {
      set({ isGenerating: false });
    }
  },
}));
