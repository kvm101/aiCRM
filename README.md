# aiCRM: Next-Generation Agentic CRM

**aiCRM** is a modern, AI-first Customer Relationship Management system designed to automate sales, client interactions, and task management. Built with a robust Java Spring Boot modular monolith backend and a lightning-fast Next.js React frontend, the system seamlessly integrates Large Language Models (Google Gemini via Spring AI) directly into core business domains.

## 🚀 Key Features

*   **Global AI Assistant**: Not just a chatbot, but a functional agent. The AI can read your database, create tasks, update deals, and draft emails autonomously using Spring AI's Tool Calling / Model Context Protocol (MCP).
*   **Omnichannel Integration**: Built-in support for receiving and sending messages via Telegram and Email. Incoming messages automatically create new clients and deals without manual entry.
*   **Kanban Task Management**: A drag-and-drop Kanban board to manage daily tasks, integrated directly with clients and deals.
*   **Deal Pipeline & Auditing**: A modern, two-column deal interface (similar to classic CRMs like Pipedrive) that tracks deal stages, multi-currency budgets (USD, EUR, GBP, UAH), and maintains a detailed, scrollable history of events and chat logs.
*   **Real-time Notifications**: WebSockets and long-polling systems deliver instant updates for new messages, AI activities, and systemic alerts straight to your UI.
*   **Premium Modern UI**: Built with Next.js, Tailwind CSS, and shadcn/ui. Features a dark mode, glassmorphism, responsive grids, and optimistic UI updates for zero-latency interactions.

---

## 🏗 Architecture Overview

The system is split into two major components:

1.  **Backend (`/backend/aicrm`)**:
    *   **Framework**: Java 17, Spring Boot 3.x.
    *   **Pattern**: Domain-Driven Design (DDD) Modular Monolith.
    *   **Modules**: `iam` (Auth), `sales` (Clients, Deals, Tasks), `communications` (Telegram, Email, WebSockets), `ai` (Spring AI Agents), and `shared`.
    *   **Database**: PostgreSQL / H2 (via Spring Data JPA).
    *   *(See `backend/aicrm/ARCHITECTURE.md` for details).*

2.  **Frontend (`/frontend`)**:
    *   **Framework**: Next.js 14+ (App Router), React 18.
    *   **Language**: TypeScript.
    *   **State Management**: React Query (Data Fetching), Zustand (AI Chat State).
    *   **Styling**: Tailwind CSS, Radix UI (shadcn/ui).
    *   *(See `frontend/ARCHITECTURE.md` for details).*

---

## 🛠 Getting Started

### Prerequisites
*   Java 17 or higher
*   Maven
*   Node.js 18+ and npm
*   Google Gemini API Key (for AI features)

### 1. Starting the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend/aicrm
   ```
2. Configure your environment variables (e.g., `spring.ai.vertex.ai.gemini.api-key`) in `application.properties`.
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *The backend runs on `http://localhost:8080` by default.*

### 2. Starting the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend runs on `http://localhost:3000` by default.*

---

## 🤖 AI Integration Details
aiCRM utilizes **Spring AI** to expose internal CRM domains to the LLM. When you ask the AI to "Create a task to call John tomorrow", the AI leverages the `@Tool` annotated methods in `SalesAITools` to execute a direct, secure Java method that updates the database, rather than just returning a text response. The frontend then automatically refetches the data to display the newly created task instantly.

## 📄 License
This project is proprietary and confidential.
