# aiCRM Frontend Architecture

## Overview
Фронтенд додатка **aiCRM** побудований на базі **Next.js (App Router)** з використанням **TypeScript**.
Архітектура орієнтована на забезпечення максимальної продуктивності, швидкої реакції інтерфейсу (через оптимістичні оновлення) та підтримки роботи в реальному часі (WebSockets).

## Технологічний Стек (Tech Stack)
- **Core**: React 18, Next.js (App Router).
- **Мова**: TypeScript (строга типізація всіх DTO та пропсів).
- **Стилізація**: Tailwind CSS.
- **UI Компоненти**: shadcn/ui (Radix UI) — доступні, кастомізовані компоненти без прив'язки до важких бібліотек.
- **Управління станом (Data Fetching)**: React Query (TanStack Query) — для кешування, фонового оновлення та мутацій даних з API.
- **Глобальний стан (Global State)**: Zustand — управління станом AI-чату (`useAIStore.ts`) та авторизації (`useAuthStore.ts`).
- **Drag & Drop**: `@dnd-kit` — для функціоналу Kanban-дошки.
- **HTTP Клієнт**: Axios (`apiClient.ts` з перехоплювачами для обробки помилок авторизації).

## Структура Директорій

```text
frontend/
├── app/                    # Next.js App Router (Сторінки та Маршрутизація)
│   ├── page.tsx            # Головний дашборд (Дашборд) — force-dynamic
│   ├── clients/page.tsx    # Управління клієнтами (Клієнти)
│   ├── deals/page.tsx      # Управління угодами (Угоди) — з inline-редагуванням та видаленням
│   ├── kanban/page.tsx     # Kanban-дошка завдань (Канбан)
│   ├── chat/page.tsx       # Інтерфейс оператора для Telegram (Чати)
│   ├── mailing/page.tsx    # Поштовий клієнт — Вхідні/Надіслані/Написати (Пошта)
│   ├── reports/page.tsx    # Аналітика та звіти
│   ├── layout.tsx          # Кореневий Layout (провайдери, GlobalAIChat, WebSocket)
│   └── globals.css         # Глобальні стилі
├── components/             # Перевикористовувані React компоненти
│   ├── ui/                 # Базові компоненти (shadcn/ui: Button, Input, Dialog, Select, etc.)
│   ├── ai/                 # AI компоненти
│   │   └── GlobalAIChat.tsx  # Глобальна AI-панель з вибором моделі, історією, попередженням на 20+ повідомлень
│   ├── dashboard/          # Компоненти дашборду
│   │   └── DashboardCharts.tsx  # Графіки воронки + картки цілей на місяць
│   ├── kanban/             # Kanban компоненти (Column, TaskCard)
│   ├── layout/             # Структурні елементи
│   │   ├── Sidebar.tsx     # Бічна панель навігації (Дашборд, Клієнти, Угоди, Канбан, Чати, Пошта)
│   │   └── Header.tsx      # Хедер із дзвоником нотифікацій + кнопка AI
│   ├── providers/          # Контекст-провайдери
│   │   └── GlobalWSProvider.tsx  # WebSocket підключення для real-time нотифікацій та чатів
│   └── DashboardGreeting.tsx # Привітання користувача
├── hooks/                  # Кастомні React Hooks
│   ├── useSales.ts         # React Query хуки: useClients, useDeals, useCreateDeal, useUpdateDeal, 
│   │                       #   useDeleteDeal, useUpdateDealStatus, useTasks, useFunnelAnalytics, 
│   │                       #   useGoalsAnalytics (з auto-refetch 30с та staleTime: 0)
│   ├── useMail.ts          # React Query хук: useFolderEmails (INBOX auto-refetch 30с)
│   ├── useNotifications.ts # React Query хуки для сповіщень (unread, markRead, markAllRead)
│   ├── useChatWS.ts        # WebSocket хук для Telegram-чатів (real-time повідомлення)
│   └── useAISuggestions.ts # Хук для AI-рекомендацій
├── store/                  # Zustand stores (глобальний стан)
│   ├── useAIStore.ts       # AI чат: messages, loadHistory(), clearMessages(), shouldClear,
│   │                       #   requestSummary(), analyzeChat(), modelProvider
│   └── useAuthStore.ts     # Авторизація: userId
├── services/               # Сервіси
│   └── apiClient.ts        # Axios інстанс (baseURL: localhost:8080, interceptors, withCredentials)
└── public/                 # Статичні файли
```

## Навігація (Sidebar)
| Іконка | Назва | Маршрут | Опис |
|---|---|---|---|
| 📊 | Дашборд | `/` | Аналітика, воронка, цілі на місяць |
| 👥 | Клієнти | `/clients` | CRUD управління клієнтами |
| 💼 | Угоди | `/deals` | Угоди з деталями, редагуванням, видаленням |
| 📋 | Канбан | `/kanban` | Drag & Drop дошка завдань |
| 💬 | Чати | `/chat` | Telegram-чат з клієнтами |
| ✉️ | Пошта | `/mailing` | Email: Вхідні, Надіслані, Написати |

## Ключові Архітектурні Рішення

### 1. Глобальний AI-асистент (Global AI Chat)
Асистент інтегрований у кореневий `layout.tsx`. Доступний на будь-якій сторінці CRM.
- **Persistent-історія**: Чат зберігається в БД (`GET /ai/history`, `DELETE /ai/history`), а не в localStorage. При відкритті панелі `loadHistory()` завантажує історію з сервера.
- **Мульти-модельність**: Користувач може обрати модель (Auto, Gemini, GitHub, Mistral, Groq) через Select у хедері чату.
- **Попередження при 20+ повідомленнях**: Жовтий банер з рекомендацією очистити історію для кращої якості AI-відповідей.
- **Кнопка 🗑️**: Очищення історії (видалення з БД).
- **Abort**: Можливість скасувати запит під час генерації.

### 2. Система Нотифікацій (Real-time)
Нотифікації приходять через **WebSocket** (`GlobalWSProvider.tsx`):
- При надходженні нового Telegram-повідомлення від клієнта.
- При отриманні нового email через IMAP.
- Бекенд публікує `NewNotificationEvent` → WebSocket → фронтенд інвалідує `queryKey: ["notifications"]` → дзвоник у Header оновлюється миттєво.

### 3. Реальний час (WebSockets)
Для модуля комунікацій (Telegram-чати) використовується `useChatWS.ts`.
Він встановлює WebSocket з'єднання з Spring Boot бекендом. Коли клієнт пише в Telegram, бекенд отримує вебхук і миттєво пушить повідомлення через WebSocket у React.

### 4. Оптимістичні Оновлення (Optimistic Updates)
У Kanban-дошці (`KanbanBoard.tsx`) при перетягуванні картки задачі, UI оновлюється миттєво, і лише потім у фоні відправляється PATCH-запит на бекенд. Це створює відчуття миттєвої реакції системи (Zero Latency).

### 5. Реактивна Аналітика (Dashboard)
- `force-dynamic` для серверного рендерингу свіжих даних.
- `refetchInterval: 30000` та `staleTime: 0` для хуків `useFunnelAnalytics` та `useGoalsAnalytics`.
- **Автоматична інвалідація кешу** `['analytics']` при будь-яких змінах угод (створення, оновлення, видалення, зміна статусу).
- Картки цілей показують: назву поточного місяця, набрано X з Y (Z%), кількість завершених угод.

### 6. Відокремлення Даних від UI (React Query)
Замість `useEffect` + `fetch` використовується `React Query`:
- Кешування відповідей.
- Refetch on window focus.
- Глобальна інвалідація (коли AI або користувач створює/редагує ресурс, кеш інвалідується).
- Auto-refetch для критичних даних (INBOX — 30с, Analytics — 30с).

### 7. Управління Угодами (Deals UI)
Сторінка угод (`deals/page.tsx`) має розширений `DealDetailsPanel`:
- Таблиця угод з фільтрацією та пошуком.
- Деталі угоди з вкладками: Огляд, Нотатки, Задачі, Активність.
- **Inline-редагування**: Кнопка ✏️ відкриває модальне вікно (Dialog) для зміни назви, бюджету, валюти.
- **Видалення**: Кнопка 🗑️ з підтвердженням через `confirm()`.

### 8. Поштовий Клієнт (Mailing)
Сторінка пошти (`mailing/page.tsx`) — повноцінний email-клієнт:
- **Вхідні**: Листи з IMAP (auto-refetch 30с), список зліва + перегляд справа.
- **Надіслані**: Копії відправлених листів.
- **Написати**: Форма з перемикачем "Зараз / Запланувати":
  - Режим "Зараз" — миттєва відправка.
  - Режим "Запланувати" — пресети (через 30 хв, 1 год, 3 год, завтра о 9:00) або довільний час.
