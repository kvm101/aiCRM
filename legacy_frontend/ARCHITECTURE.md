# aiCRM Frontend Architecture

## Огляд

Фронтенд **aiCRM** — застосунок на **Next.js 16** (App Router) і **React 19** з **TypeScript**. Архітектура робить наголос на швидкий UI (кешування React Query, оптимістичні оновлення там, де доречно), **серверні компоненти** для даних дашборду та **прокси/BFF через Route Handlers** там, де потрібні cookies й безпечне звернення до Java-бекенду.

Бекенд за замовчуванням очікується на `http://localhost:8080` (`NEXT_PUBLIC_API_URL` або `BACKEND_API_URL`).

## Технологічний стек

| Область | Технологія |
|---------|------------|
| Framework | Next.js **16**, App Router |
| UI | React **19**, Tailwind CSS **4** |
| Компоненти | **shadcn/ui** поверх **Radix UI** (`radix-ui`) |
| Дані клієнта | **TanStack React Query v5** |
| Глобальний стан | **Zustand** (persist для проєкту) |
| HTTP | **Axios** (`apiClient`) для клієнта; **fetch** у серверному шарі (`serverApiClient`) |
| Графіки | **Recharts** |
| Kanban DnD | **@dnd-kit** |
| Іконки | **lucide-react** |

## Коренева композиція (`app/layout.tsx`)

- **`QueryProvider`** (`@/providers/QueryProvider`) — React Query з дефолтним `staleTime` (наприклад, 60 с для queries).
- **`GlobalWSProvider`** — WebSocket-підключення для чатів/подій у реальному часі.
- **`Sidebar`** + **`Header`** — навігація, перемикач організації/проєкту, нотифікації, кнопка AI.
- **`AuthGuard`** — для всіх маршрутів, крім `/login`: спіннер під час перевірки сесії, порожній контент з редіректом у `Header`, якщо користувача немає.
- **`GlobalAIChat`** — плаваюча панель AI на всіх сторінках.

## Структура директорій

```text
frontend/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── login/page.tsx
│   ├── clients/page.tsx
│   ├── deals/page.tsx
│   ├── kanban/page.tsx
│   ├── chat/page.tsx
│   ├── mailing/page.tsx
│   ├── reports/page.tsx          # звіти (клієнт + server actions)
│   ├── reports/actions.ts        # server actions → Spring /reports/request
│   └── api/
│       ├── reports/route.ts               # GET: проксі списку /reports
│       ├── reports/[id]/download/route.ts
│       ├── files/[id]/route.ts
│       └── files/[id]/download/route.ts   # завантаження вкладень через BFF
├── components/
│   ├── ui/                       # primitives (Button, Dialog, Table, …)
│   ├── ai/GlobalAIChat.tsx
│   ├── dashboard/DashboardCharts.tsx
│   ├── kanban/KanbanBoard.tsx, …
│   ├── layout/Sidebar.tsx, Header.tsx
│   └── providers/
│       ├── GlobalWSProvider.tsx
│       └── AuthGuard.tsx
├── hooks/
│   ├── useSales.ts               # CRM: клієнти, угоди, задачі, аналітика
│   ├── useMail.ts
│   ├── useNotifications.ts
│   ├── useChatWS.ts              # чати + WebSocket
│   └── useAISuggestions.ts
├── store/
│   ├── useAuthStore.ts           # поточний користувач, логіка сесії
│   ├── useAIStore.ts             # стан глобального AI-чату
│   └── useProjectStore.ts        # організація, проєкти, активний проєкт (persist)
├── services/
│   ├── apiClient.ts              # Axios + заголовки X-User-Id, X-Project-Id
│   ├── serverApiClient.ts       # fetch + cookies user_id / project_id (SSR, actions)
│   └── dashboard.server.ts      # SSR-агрегація для головної: GET /dashboard/stats
├── lib/utils.ts                  # cn() тощо
└── public/
```

## Мультиконтекст: організація та проєкт

- У **`Header`** компонент **ProjectSwitcher** завантажує `GET /iam/organizations/my` та `GET /iam/projects`.
- **`useProjectStore`** (Zustand + `persist`): зберігає `activeProjectId`, синхронізує cookie **`project_id`** для серверних викликів.
- **`apiClient`** автоматично дода **`X-Project-Id`** (з стору, cookie або fallback) і **`X-User-Id`** / **`X-User-Role`** з **`useAuthStore`**.

Це узгоджується з бекенд-фільтрацією сутностей за проєктом.

## Дані та патерни

### 1. Клієнтський даний шар (React Query)

- Хуки в `hooks/useSales.ts`, `useMail.ts`, `useNotifications.ts` — кеш, мутації, інвалідація ключів (наприклад, аналітика після змін угод).
- Типові налаштування refetch інтервалів описані в самих хуках там, де потрібні «живі» дані (пошта, аналітика).

### 2. Серверний рендер і BFF

- **`app/page.tsx`** (дашборд): `dynamic = 'force-dynamic'`, **`getDashboardStats()`** з **`dashboard.server.ts`** — виклик **`GET /dashboard/stats`** через `serverFetch` з cookies.
- **`Server Actions`** (`app/reports/actions.ts`): створення задачі звіту **`POST /reports/request`**.
- **`app/api/*/route.ts`**: Route Handlers проксують списки звітів і файли, підставляючи заголовки з cookies (`user_id`, `project_id`), щоб не розкривати прямі запити до Java з браузера для чутливих операцій або щоб узгодити завантаження.

### 3. Авторизація

- Сторінка **`/login`**, **`AuthGuard`**, **`Header`** orchestrate redirect, якщо користувач не завантажився.
- Поточний користувач у **`useAuthStore`**; сервер використовує cookie **`user_id`** (див. `serverApiClient`).

### 4. Реальний час

- **`GlobalWSProvider`**: зв’язок із Spring WebSocket для оновлення чатів та нотифікацій.
- **`useChatWS`** — дані відкритих сесій, у т. ч. **`unreadCount`** для badge в Sidebar.

### 5. Глобальний AI чат

- **`GlobalAIChat`** + **`useAIStore`**: історія з бекенду (`/ai/history`), вибір провайдера, очищення історії, скасування запиту тощо.
- Запити йдуть через **`apiClient`** на Spring **`/ai/...`**.

### 6. Kanban

- **`@dnd-kit`** у **`KanbanBoard`**: локальний optimistic UI перед підтвердженням PATCH на бекенді.

### 7. Звіти (`/reports`)

- UI на клієнті: типи звітів (воронка, виручка, активність, клієнти), створення задачі через server action, список через **`GET`** на **`/api/reports`**, завантаження через **`/api/reports/[id]/download`**.
- статуси `PENDING` → `COMPLETED` / `FAILED` з опитуванням/оновленням списку в UI.

### 8. Вкладення

- Завантаження та робота з файлами інтегровані з бекендом **`/files`**; для завантаження через Next може використовуватись **`/api/files/...`** (проксі з заголовком проєкту).

## Навігація (Sidebar)

Актуальні пункти в **`components/layout/Sidebar.tsx`**:

| Назва | Шлях | Примітка |
|-------|------|----------|
| Дашборд | `/` | SSR-статистика + charts |
| Клієнти | `/clients` | CRUD клієнтів |
| Угоди | `/deals` | Угоди, панелі деталей |
| Канбан | `/kanban` | Задачі |
| Чати | `/chat` | Telegram-оператор, badge непрочитаних |
| Пошта | `/mailing` | Вхідні / надіслані / Compose |

Додаткові посилання:

- **`Header`**: перемикач організації/проєкту, нотифікації, профіль.
- **`/settings`** — пункт у нижній частині Sidebar (розвиток UI налаштувань).

Сторінка **`/reports`** існує в `app/reports`; за потреби її можна додати в основний масив `navigation`, щоб вона була в боковій панелі поряд з іншими розділами.

## Зв’язок з бекендом (коротко)

- Основний API: REST на **Spring Boot** (див. **`backend/aicrm/ARCHITECTURE.md`**).
- Заголовки **`X-Project-Id`** / **`X-User-Id`** узгоджують tenancy з серверною логікою.
- Семантичний пошук **`POST /search/semantic`** на бекенді може бути вимкнений, якщо не піднято `VectorStore`; окремого UI пошуку в цьому репозиторії може не бути — інтеграція за потреби додається в `Header` або окрему сторінку.
