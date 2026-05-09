# aiCRM Backend Architecture

## Overview
Додаток **aiCRM** використовує архітектуру **Модульного моноліту (Modular Monolith)**, що базується на принципах **Domain-Driven Design (DDD)**. 
Замість класичної шарової архітектури код розділено на незалежні бізнес-домени. Це забезпечує високу зв'язність (high cohesion) всередині модулів, зменшує залежності між ними (loose coupling) та дозволяє легко масштабувати додаток.

Особливістю архітектури є глибока інтеграція **Штучного Інтелекту (Spring AI)** з мульти-провайдерною системою (Gemini, GitHub Models, Mistral, Groq), який працює як повноцінний автономний агент через механізм Tool Calling з автоматичним fallback між моделями.

## Функціональні вимоги (Functional Requirements)
- **Управління користувачами (IAM)**: Реєстрація, автентифікація, управління сесіями (HttpOnly cookie), перегляд профілів.
- **Управління клієнтами (Sales)**: Ведення бази клієнтів (CRM) — створення, оновлення (PATCH), видалення (CRUD), фільтрація по воронці продажів.
- **Управління угодами (Sales)**: Фінансовий облік угод (`Deal`), відстеження етапів, мультивалютність (UAH, USD, EUR, GBP), історія взаємодій (`DealEvent`). Повний CRUD через UI та AI.
- **Управління завданнями (Sales)**: Планування роботи у форматі Kanban-дошки. Створення завдань, робота з дедлайнами та описами.
- **Аналітика (Analytics)**: Воронка продажів (по статусах угод), цілі на місяць (доходи від завершених угод з динамічною фільтрацією за поточний місяць).
- **Комунікації (Communications)**: Інтеграція з Telegram та Email (SMTP відправка + IMAP отримання), WebSockets для реальному часу. Система внутрішніх сповіщень (`Notification`).
- **Автоматизація (Integration)**: `SalesIntegrationService` автоматично створює лідів та угоди при надходженні нових повідомлень.
- **Штучний інтелект (AI)**: Глобальний чат-асистент з persistent-історією в БД, підтримкою 4 LLM-провайдерів та повним CRUD доступом до всіх модулів CRM.

## Структура Проєкту
Вихідний код знаходиться у `src/main/java/vasyl/karpliak/aiCRM/` і поділений на такі основні домени:

### 1. `ai` (Штучний Інтелект та Агенти)
Модуль для роботи зі Spring AI та LLM (мульти-провайдерна архітектура).
- **`config`**: `AiModelConfig` — фабрика AI-моделей: налаштування Groq (`llama3-groq-70b-8192-tool-use-preview`), GitHub Models (`gpt-4o-mini`), Mistral (`mistral-small-latest`). Gemini конфігурується через `application.yaml`.
- **`controller`**: `AIChatController` — обробляє запити від фронтенду (`POST /ai/chat`), зберігає історію чату в БД (`GET /ai/history`, `DELETE /ai/history`), повертає `totalMessages` та `shouldClear` прапорець при 20+ повідомленнях.
- **`service`**: 
  - `AIChatService` — формує системний промпт та конвертує історію з DTO у Spring AI `Message` об'єкти.
  - `AiOrchestrator` — реалізує стратегію Gemini → GitHub → Mistral → Groq з автоматичним fallback. Підтримує явний вибір провайдера або автоматичний каскадний виклик.
- **`tools`**: `SalesAITools`, `CommunicationsAITools` — класи з методами `@Tool`, що реалізують концепцію Function Calling. Надають AI-моделі прямий доступ до CRUD операцій: `getClients`, `createClient`, `createDeal`, `getDeals`, `getDeal`, `updateDealStatus`, `updateDealDetails`, `deleteDeal`, `getAllTasks`, `createTask`, `getOpenChats`, `getMessagesSince`, `sendEmail`.
- **`domain`**: `AiChatMessage` — JPA-сутність для збереження історії чату в БД (userId, role, content, createdAt).
- **`repository`**: `AiChatMessageRepository` — CRUD для історії чату (пошук/підрахунок/видалення по userId).
- **`dto`**: DTO-класи (`TaskResponse`, `ClientResponse`, `ChatSessionResponse`, `MessageResponse`, `ChatRequest`) для безпечної JSON серіалізації результатів AI-інструментів.

### 2. `analytics` (Аналітика та Звітність)
- **Відповідальність**: Обчислення метрик для дашборду.
- **Ключові компоненти**: `AnalyticsController`, `AnalyticsService`.
- **Функціональність**: 
  - Воронка продажів (`getFunnelData`) — розподіл угод за статусами.
  - Цілі на місяць (`getGoals`) — підрахунок доходу від завершених угод (`DONE`) з фільтрацією за поточний місяць (через `findByUserIdAndStatusAndUpdatedAtBetween`).

### 3. `iam` (Identity and Access Management)
- **Відповідальність**: Реєстрація, автентифікація, авторизація та ролі.
- **Ключові компоненти**: `AuthController`, `UserService`, `UserRepository`, сутність `User`.

### 4. `sales` (Sales & CRM Core)
- **Відповідальність**: Управління клієнтами, угодами (Deals) та завданнями (Kanban). Автоматизована інтеграція зовнішніх повідомлень.
- **Ключові компоненти**: `ClientController`, `DealController`, `TaskController`, `IntegrationController`.
- **Сервіси**: `DealService` (обробка логіки угод, мультивалютності, запис логів подій), `SalesIntegrationService` (авто-створення клієнтів/угод з повідомлень).
- **Сутності**: `Client`, `Deal`, `DealEvent`, `Task`.
- **Репозиторії**: `DealRepository` (з методом `findByUserIdAndStatusAndUpdatedAtBetween` для місячної аналітики).

### 5. `communications` (Омніканальність та Сповіщення)
- **Відповідальність**: Робота з повідомленнями (Telegram, Email), WebSockets, система внутрішніх сповіщень.
- **Ключові компоненти**: 
  - `ChatController`, `MailController`, `TelegramWebhookController`, `NotificationController`.
  - Сутності: `ChatSession`, `Message`, `EmailMessage` (з `externalMessageId` для IMAP дедуплікації), `Notification`.
  - `RabbitMQConfig`, `MessageDispatcherService` — асинхронна маршрутизація повідомлень (RabbitMQ).
  - `MailService` — розсилка email через SMTP Gmail з підтримкою відкладеної відправки (`TaskScheduler`).
  - `InboundEmailService` — **IMAP-клієнт** для автоматичного отримання вхідної пошти (`@Scheduled` кожні 60 секунд). Зберігає нові листи в БД, створює нотифікації та WebSocket-сповіщення.
  - `MessageOutboundListener`, `InboundMessageEvent`, `NewNotificationEvent` — Spring Events для внутрішньої комунікації.
  - `TelegramAdapter` — адаптер для відправки відповідей у Telegram.

### 6. `shared` (Shared Kernel)
- **Відповідальність**: Спільна інфраструктура, глобальні налаштування.
- **Ключові компоненти**: 
  - `GlobalExceptionHandler` — уніфікована обробка помилок.
  - `WebSocketConfig`, `ChatWebSocketHandler` — конфігурація WebSockets для двостороннього зв'язку з Next.js (Chats + Notifications).
  - `WebConfig` — CORS конфігурація.

---

## Архітектура всередині доменів (Package by Component)
Кожен домен дотримується чіткої внутрішньої структури шарів:
- **`controller`**: REST API шар. Приймає HTTP-запити, валідує вхідні дані.
- **`service`**: Шар бізнес-логіки. Містить бізнес-правила та управляє транзакціями (`@Transactional`). Сервіси модулів викликаються безпосередньо або через AI Tools.
- **`repository`**: Шар доступу до даних (Spring Data JPA).
- **`domain`**: JPA Сутності (`@Entity`). Двосторонні зв'язки строго контролюються, щоб уникати проблем із серіалізацією.
- **`dto`**: Об'єкти передачі даних. Особливо критичні для обміну даними зі Spring AI (в пакеті `ai.dto`).
- **`config`**: Конфігураційні класи (`@Configuration`, `@Bean`) для зовнішніх інтеграцій.
- **`enums`**: Перелічувані типи (`DealStatus`, `SessionStatus`, `SenderType`, `UserRoles`).
- **`adapter`**: Адаптери для зовнішніх сервісів (наприклад, `TelegramAdapter`).

## AI Мульти-провайдерна Архітектура

```
Користувач → AIChatController → AIChatService → AiOrchestrator
                                                      ↓
                                         ┌─────────────────────────────┐
                                         │   Стратегія Fallback:       │
                                         │   1. Google Gemini 2.5 Flash│
                                         │   2. GitHub GPT-4o-mini     │
                                         │   3. Mistral Small          │
                                         │   4. Groq Llama3 Tool-Use   │
                                         └─────────────────────────────┘
                                                      ↓
                                         ChatClient.tools(salesAITools, communicationsAITools)
                                                      ↓
                                         AI виконує Tool Calls → мутації БД
```

## Взаємодія Backend - Frontend (Next.js)
Бекенд надає REST API, яке споживається Next.js клієнтом. 
Деякі специфічні інтеграції:
- **Real-time (WebSockets)**: Використовуються для оновлення чатів та нотифікацій у реальному часі.
- **REST для AI**: AI-чат використовує `POST /ai/chat` з передачею історії та вибраного провайдера.
- **IMAP Polling**: Бекенд самостійно перевіряє пошту кожні 60с та push-ить нотифікації через WebSocket.

---

## API Ендпоінти

### 🤖 AI Асистент (`/ai`)
- `POST /ai/chat` — Надіслати повідомлення AI-асистенту. Повертає `reply`, `totalMessages`, `shouldClear`. Зберігає кожне повідомлення в БД.
- `GET /ai/history` — Отримати збережену історію чату поточного користувача.
- `DELETE /ai/history` — Очистити всю історію чату.

### 💬 Чати та Комунікації (`/chats`, `/webhooks`, `/mail`, `/notifications`)
- `GET /chats` — Отримати всі відкриті сесії чатів.
- `GET /chats/{id}/messages` — Отримати історію повідомлень конкретного чату.
- `POST /chats/{id}/messages` — Надіслати нове повідомлення в чат.
- `POST /webhooks/telegram/{teamId}` — Вхідний вебхук від Telegram.
- `POST /mail/mail` — Надіслати електронний лист (з підтримкою відкладеної відправки).
- `GET /mail/folder/{folder}` — Отримати листи з папки (INBOX, SENT).
- `GET /notifications` — Отримати список сповіщень.
- `GET /notifications/unread` — Отримати непрочитані сповіщення.
- `PATCH /notifications/{id}/read` — Позначити як прочитане.
- `PATCH /notifications/read-all` — Позначити всі як прочитані.

### 📊 Аналітика (`/analytics`)
- `GET /analytics/funnel` — Дані воронки продажів (розподіл по статусах).
- `GET /analytics/goals` — Цілі на поточний місяць (дохід, кількість завершених угод).

### 🔐 Авторизація та Користувачі (`/auth`, `/users`)
- `POST /auth/register` — Реєстрація.
- `POST /auth/login` — Вхід.
- `GET /users/{id}` — Профіль користувача.

### 👥 Клієнти та Угоди (`/clients`, `/deals`)
- CRUD: `POST /clients`, `GET /clients/filtered`, `PATCH /clients/{id}`, `DELETE /clients/{id}`.
- Угоди: `POST /deals`, `GET /deals`, `GET /deals/{id}`, `PATCH /deals/{id}`, `DELETE /deals/{id}`, `PATCH /deals/{id}/status`.
- Історія: `GET /deals/{dealId}/events`.
- Автоматизація: `POST /integration/incoming-message`.

### 📋 Завдання (`/tasks`)
- CRUD: `POST /tasks`, `GET /tasks/filtered`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`.

### ⚙️ Спільні
- `GET /health` — Перевірка статусу працездатності.
