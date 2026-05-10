# aiCRM Backend Architecture

## Огляд

**aiCRM** — модульний моноліт (**Modular Monolith**) на Spring Boot **3.4**, Java **21**, з упорядкуванням пакетів за доменами (наближено до **DDD**). Кожен домен містить контролери, сервіси, репозиторії, сутності та DTO з високою зв’язністю всередині й обмеженими залежностями між модулями.

Інтеграція з **Spring AI** (BOM **1.1.5**) дає мульти-провайдерний LLM чат із tool calling та (опціонально) **векторне сховище pgvector**, **Embeddings**, **MCP server** (транспорт SSE). Паралельно використовується **RabbitMQ** для асинхронної обробки повідомлень комунікацій, вкладень файлів і генерації звітів.

Увімкнені **virtual threads** (`spring.threads.virtual.enabled`) для масштабування довгоживучих SSE-з’єднань MCP.

## Інфраструктура та залежності

| Компонент | Призначення |
|-----------|-------------|
| **PostgreSQL** + JPA (Hibernate) | Основна БД (`ddl-auto: update`). Розширення `vector` створюється на старті (`PgVectorExtensionInitializer`), якщо дозволяє середовище. |
| **RabbitMQ** | Черги: маршрутизація каналів комунікацій, обробка файлів (`FileProcessingListener`), генерація звітів (`ReportGenerationListener`). Окремі конфіг-класи в доменах. |
| **WebSocket** | Реальний час для чатів і сповіщень (`WebSocketConfig`, `ChatWebSocketHandler`). |
| **Spring Mail** | SMTP надсилання, IMAP-поллінг для вхідних листів. |
| **Springdoc OpenAPI** | Документація REST (`/swagger-ui.html` типовий для springdoc). |
| **Apache Tika** | Вилучення тексту з завантажених файлів (модуль `attachments`). |
| **commons-csv** | Експорт звітів у CSV. |

### Конфігурація AI та векторів

- Чат Gemini через `spring.ai.google.genai` (ключ з оточення, напр. `GEMINI_API_KEY`).
- Додаткові провайдери (Groq, GitHub Models, Mistral) керуються власними бінами/налаштуваннями в модулі `ai` (`AiModelConfig`, оркестрація fallback).
- `application.yaml` може виключати автоконфігурацію **OpenAI Embeddings** і **PgVectorStore** — тоді бін **`VectorStore` відсутній**, і модуль семантичного пошуку **не активується** (`@ConditionalOnBean(VectorStore.class)`).

### MCP сервер

- Увімкнення через `spring.ai.mcp.server` (SSE): ендпоінти типу **`/mcp/sse`** та **`/mcp/message`** згідно з конфігурацією в `application.yaml`.
- Призначення: зовнішні клієнти MCP можуть отримувати інструменти/контекст CRM узгоджено зі Spring AI MCP starter’ами (`spring-ai-starter-mcp-client` / `-server` в `pom.xml`).

## Контекст запиту: користувач і проєкт

У багатьох сценаріях дані ізольовані за **project** (робочим простором усередині організації):

- HTTP-заголовки **`X-Project-Id`**, **`X-User-Id`** (де потрібно).
- **`RequestContextHelper`** — резервні значення для розробки, якщо заголовки відсутні.
- Контролери IAM також приймають cookie **`user_id`** для сумісності з браузерними сесіями.

## Функціональні вимоги (вищий рівень)

- **IAM**: користувачі, ролі, реєстрація/логін, Google OAuth2, **організації** та **проєкти**.
- **Sales**: клієнти, угоди, події по угодах, задачі Kanban, інтеграційний вебхук вхідних повідомлень.
- **Analytics**: воронка, цілі на місяць (доходи/закриття).
- **Communications**: Telegram, Email (SMTP/IMAP), внутрішні нотифікації, RabbitMQ-диспетчинг, WebSocket.
- **AI**: глобальний чат-асистент з історією в БД, tool calling до Sales/Communications.
- **Attachments**: завантаження файлів (зв’язок з подіями угод, задачами, нотатками клієнта тощо), черга асинхронної обробки (текст).
- **Reporting**: асинхронне формування CSV-звітів через RabbitMQ, список задач та завантаження файлу.
- **Search**: семантичний пошук по векторному сховищу за **умови** наявності `VectorStore`.
- **Dashboard**: агреговані лічильники для головної панелі за `projectId`.
- **Shared**: CORS, WebSocket, глобальна обробка помилок, сидування БД тощо.

## Структура пакетів (`vasyl.karpliak.aiCRM`)

### `ai`

- LLM чат (`AIChatController`: `/ai/...`), історія (`AiChatMessage`), `AIChatService`, `AiOrchestrator` (fallback між провайдерами).
- **`tools`**: `SalesAITools`, `CommunicationsAITools` — методи `@Tool` для мутацій/читання даних CRM.

### `analytics`

- `AnalyticsController`, `AnalyticsService` — метрики воронки та місячних цілей.

### `iam`

- `AuthController`, `UserController`, `User`, `UserService`.
- **`OrganizationController`** (`/iam/organizations`) — «моя» організація, створення.
- **`ProjectController`** (`/iam/projects`) — список/створення проєктів у межах організації користувача.
- **OAuth2**: `OAuth2Controller` (`/iam/oauth2/google/...`), `SystemOAuth2Controller` (`/auth/oauth2/google/...`) для різних callback-потоків.

### `sales`

- `ClientController`, `DealController`, `TaskController`, `IntegrationController`.
- Сутності: `Client`, `Deal`, `DealEvent`, `Task`; сервіси угод та `SalesIntegrationService` (ліди/угоди з вхідних повідомлень).

### `communications`

- `ChatController`, `MailController`, `TelegramWebhookController`, `NotificationController`.
- RabbitMQ (`RabbitMQConfig`, `MessageDispatcherService`), пошта, адаптер Telegram, доменні `ChatSession`, `Message`, `Notification`, події для WebSocket.

### `attachments`

- **`FileController`** (`/files`): список, `multipart` upload з опціональними зв’язками (`dealEventId`, `taskId`, `clientId`, `clientNoteIndex`), завантаження з диска, видалення.
- **`FileProcessingRabbitConfig`** + **`FileProcessingListener`** — асинхронна обробка черги після створення запису вкладення.
- **`FileAttachmentService`**, **`FileTextExtractor`** (Tika), статуси `FileAttachmentStatus`, сутність `FileAttachment`.

### `reporting`

- **`ReportRequestController`**: `POST /reports/request`, `GET /reports` — заявки та список по проєкту.
- **`ReportDownloadController`**: `GET /reports/{id}/download` — CSV після `COMPLETED`.
- **`ReportingService`** — збереження `ReportTask`, публікація в RabbitMQ; **`ReportGenerationListener`** — генерація CSV у каталозі на кшталт `~/aicrm-reports/`.
- Типи звітів та статуси: `ReportType`, `ReportStatus`.

### `search`

- **`SemanticSearchController`**: `POST /search/semantic` (тіло: запит, `topK`) — **тільки якщо** в контексті є `VectorStore`.
- **`SemanticSearchService`** — `similaritySearch`, фільтрація метаданих за `projectId`.

### `shared`

- **`DashboardController`**: `GET /dashboard/stats` — зведення по клієнтах, задачах, чатах, угодах, непрочитаних (з урахуванням `X-Project-Id`).
- **`GlobalExceptionHandler`**, **`WebConfig`**, **`WebSocketConfig`**, **`ChatWebSocketHandler`**, **`DatabaseSeeder`**, **`RequestContextHelper`**, **`PgVectorExtensionInitializer`**, **`HealthController`**.

## Внутрішня структура домену (package by feature)

- `controller` — REST
- `service` — бізнес-логіка, `@Transactional` де потрібно
- `repository` — Spring Data JPA
- `domain` — `@Entity`
- `dto` — контракти API / AI
- `config`, `listener`, `enums`, `adapter` — за потреби

## Схема: AI → інструменти → БД

```
Клієнт → AIChatController → AIChatService → AiOrchestrator (LLM провайдери)
                    ↓
          ChatClient + tools(SalesAITools, CommunicationsAITools)
                    ↓
          Виклики @Tool → сервіси доменів → JPA → PostgreSQL
```

## Схема: асинхронні звіти та файли

```
HTTP → ReportingService / FileAttachmentService → RabbitMQ → Listener → файли на диску / оновлення статусів у БД
```

## Взаємодія з Next.js фронтендом

- REST API на порту **8080** (за замовчуванням).
- Фронт передає **`X-Project-Id`** та **`X-User-Id`** (і дублює частину через cookies для SSR).
- WebSocket для чатів і нотифікацій.
- Окремі Next **Route Handlers** можуть проксувати `/reports` та завантаження файлів з передачею тих самих заголовків.

---

## Довідник REST (основні префікси)

> Точні шляхи методів див. у відповідних `@RestController`; нижче — групування за модулями.

| Префікс | Модуль |
|---------|--------|
| `/ai` | Чат, історія |
| `/auth`, `/users` | Автентифікація, профіль |
| `/iam/organizations`, `/iam/projects` | Організація, проєкти |
| `/iam/oauth2/google/...`, `/auth/oauth2/google/...` | OAuth2 Google |
| `/clients`, `/deals`, `/tasks` | CRM core |
| `/integration` | Вхідні повідомлення для інтеграцій |
| `/analytics` | Воронка, цілі |
| `/chats`, `/mail`, `/webhooks/telegram`, `/notifications` | Комунікації |
| `/files` | Вкладення |
| `/reports` | Звіти (запит, список, завантаження) |
| `/search/semantic` | Семантичний пошук (умовно) |
| `/dashboard` | Статистика дашборду |
| `GET /` | Health-перевірка (`HealthController`) |
