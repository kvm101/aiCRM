# aiCRM Backend Architecture

## Overview
Додаток **aiCRM** використовує архітектуру **Модульного моноліту (Modular Monolith)**, що базується на принципах **Domain-Driven Design (DDD)**. 
Замість класичної шарової архітектури код розділено на незалежні бізнес-домени. Це забезпечує високу зв'язність (high cohesion) всередині модулів, зменшує залежності між ними (loose coupling) та дозволяє легко масштабувати додаток.

Особливістю архітектури є глибока інтеграція **Штучного Інтелекту (Spring AI + Gemini)**, який працює як повноцінний автономний агент (через механізм Tool Calling / Model Context Protocol).

## Функціональні вимоги (Functional Requirements)
- **Управління користувачами (IAM)**: Реєстрація, автентифікація, управління сесіями (HttpOnly cookie), перегляд профілів.
- **Управління клієнтами (Sales)**: Ведення бази клієнтів (CRM) — створення, оновлення (PATCH), видалення (CRUD), фільтрація по воронці продажів.
- **Управління угодами (Sales)**: Фінансовий облік угод (`Deal`), відстеження етапів, мультивалютність (UAH, USD, EUR, GBP), історія взаємодій (`DealEvent`).
- **Управління завданнями (Sales)**: Планування роботи у форматі Kanban-дошки. Створення завдань, робота з дедлайнами та описами.
- **Комунікації (Communications)**: Інтеграція з Telegram та Email, WebSockets для передачі повідомлень на клієнт в реальному часі. Система внутрішніх сповіщень (`Notification`).
- **Автоматизація (Integration)**: `SalesIntegrationService` автоматично створює лідів та угоди при надходженні нових повідомлень.
- **Штучний інтелект (AI)**: Глобальний чат-асистент, який не лише відповідає на питання, а й безпосередньо керує CRM-системою (створює/редагує клієнтів та угоди, задачі, читає чати, відправляє email).

## Структура Проєкту
Вихідний код знаходиться у `src/main/java/vasyl/karpliak/aiCRM/` і поділений на такі основні домени:

### 1. `ai` (Штучний Інтелект та Агенти)
Новий модуль для роботи зі Spring AI та LLM (Google Gemini).
- **`controller`**: `AIChatController` — обробляє запити від фронтенду.
- **`service`**: `AIChatService` — конфігурує `ChatClient` та управляє системними промптами.
- **`tools`**: `SalesAITools`, `CommunicationsAITools` — класи з методами `@Tool`, що реалізують концепцію Function Calling (наближену до Model Context Protocol). Надають AI-моделі прямий доступ до внутрішніх сервісів системи.
- **`dto`**: DTO-класи (`TaskResponse`, `ClientResponse`, `ChatSessionResponse`, `MessageResponse`) для безпечної JSON серіалізації результатів AI-інструментів, що запобігає проблемі нескінченної рекурсії (StackOverflow) при серіалізації JPA-сутностей.

### 2. `iam` (Identity and Access Management)
- **Відповідальність**: Реєстрація, автентифікація, авторизація та ролі.
- **Ключові компоненти**: `AuthController`, `UserService`, `UserRepository`, сутність `User`.

### 3. `sales` (Sales & CRM Core)
- **Відповідальність**: Управління клієнтами, угодами (Deals) та завданнями (Kanban). Автоматизована інтеграція зовнішніх повідомлень.
- **Ключові компоненти**: `ClientController`, `DealController`, `TaskController`, `IntegrationController`.
- **Сервіси**: `DealService` (обробка логіки угод, мультивалютності, запис логів подій), `SalesIntegrationService` (авто-створення клієнтів/угод з повідомлень).
- **Сутності**: `Client`, `Deal`, `DealEvent`, `Task`.

### 4. `communications` (Омніканальність та Сповіщення)
- **Відповідальність**: Робота з повідомленнями (Telegram, Email), WebSockets, система внутрішніх сповіщень.
- **Ключові компоненти**: 
  - `ChatController`, `MailController`, `TelegramWebhookController`, `NotificationController`.
  - Сутності: `ChatSession`, `Message`, `EmailMessage`, `Notification`.
  - `RabbitMQConfig`, `MessageDispatcherService` — асинхронна маршрутизація повідомлень.
  - `MailService` — розсилка email та створення сповіщень.

### 5. `shared` (Shared Kernel)
- **Відповідальність**: Спільна інфраструктура, глобальні налаштування.
- **Ключові компоненти**: 
  - `GlobalExceptionHandler` — уніфікована обробка помилок.
  - `WebSocketConfig`, `ChatWebSocketHandler` — конфігурація WebSockets для двостороннього зв'язку з Next.js (Dashboard та Chats).

---

## Архітектура всередині доменів (Package by Component)
Кожен домен дотримується чіткої внутрішньої структури шарів:
- **`controller`**: REST API шар. Приймає HTTP-запити, валідує вхідні дані.
- **`service`**: Шар бізнес-логіки. Містить бізнес-правила та управляє транзакціями (`@Transactional`). Сервіси модулів викликаються безпосередньо або через AI Tools.
- **`repository`**: Шар доступу до даних (Spring Data JPA).
- **`domain`**: JPA Сутності (`@Entity`). Двосторонні зв'язки строго контролюються, щоб уникати проблем із серіалізацією.
- **`dto`**: Об'єкти передачі даних. Особливо критичні для обміну даними зі Spring AI (в пакеті `ai.dto`).

## Взаємодія Backend - Frontend (Next.js)
Бекенд надає REST API, яке споживається Next.js клієнтом. 
Деякі специфічні інтеграції:
- **Real-time (WebSockets)**: Використовуються для оновлення чатів у реальному часі (сутності `Message` передаються через `ChatWebSocketHandler`).
- **SSE (Server-Sent Events) / REST для AI**: AI-чат використовує звичайний REST (або потенційно SSE для стрімінгу) для спілкування агента з UI.

---

## API Ендпоінти (Оновлені)

### 🤖 AI Асистент (`/ai`)
- `POST /ai/chat` — Надіслати повідомлення AI-асистенту (приймає текст та ID користувача, повертає згенеровану відповідь). Під капотом AI може викликати мутації бази даних через свої інструменти.

### 💬 Чати та Комунікації (`/chats`, `/webhooks`, `/mail`, `/notifications`)
- `GET /chats` — Отримати всі відкриті сесії чатів.
- `GET /chats/{id}/messages` — Отримати історію повідомлень конкретного чату.
- `POST /chats/{id}/messages` — Надіслати нове повідомлення в чат (відправляє в БД, у WebSocket та RabbitMQ).
- `POST /webhooks/telegram/{teamId}` — Вхідний вебхук від Telegram.
- `POST /mail/mail` — Надіслати електронний лист.
- `GET /notifications` — Отримати список сповіщень.
- `PATCH /notifications/{id}/read` — Позначити як прочитане.

### 🔐 Авторизація та Користувачі (`/auth`, `/users`)
- Звичайний CRUD: `/auth/register`, `/auth/login`, `/users/{id}` тощо.

### 👥 Клієнти та Угоди (`/clients`, `/deals`)
- Звичайний CRUD: `POST /clients`, `GET /clients/filtered`, `PATCH /clients/{id}`, `DELETE /clients/{id}`.
- Угоди: `POST /deals`, `PATCH /deals/{id}`, `GET /deals/{dealId}/events` (Історія подій).
- Автоматизація: `POST /integration/incoming-message` (обробка вхідних лідів).

### 📋 Завдання (`/tasks`)
- Звичайний CRUD: `POST /tasks`, `GET /tasks/filtered`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`.

### ⚙️ Спільні
- `GET /health` — Перевірка статусу працездатності.
