import type { Lang } from '@/store/useLanguageStore';

export const t = (lang: Lang) => ({
  // Greeting
  greeting: {
    title: lang === 'ua' ? 'Панель управління' : 'Dashboard',
    subtitle: lang === 'ua' ? 'Аналітика та ключові показники діяльності' : 'Analytics and key performance indicators',
  },

  // Stats tiles
  stats: {
    users: {
      title: lang === 'ua' ? 'Клієнти' : 'Customers',
      change: (total: number) =>
        lang === 'ua' ? `Всього в базі: ${total}` : `Total in database: ${total}`,
    },
    tasks: {
      title: lang === 'ua' ? 'Задачі' : 'Tasks',
      change: lang === 'ua' ? 'Потребують виконання' : 'Pending execution',
    },
    chats: {
      title: lang === 'ua' ? 'Чати' : 'Chats',
      active: (count: number) =>
        lang === 'ua' ? `Активних сесій: ${count}` : `Active sessions: ${count}`,
      none: lang === 'ua' ? 'Немає відкритих чатів' : 'No open chats',
    },
    unread: {
      title: lang === 'ua' ? 'Нові повідомлення' : 'New Messages',
      attention: lang === 'ua' ? 'Потребують відповіді' : 'Require reply',
      allRead: lang === 'ua' ? 'Всі повідомлення прочитано' : 'All messages read',
    },
    deals: {
      title: lang === 'ua' ? 'Угоди' : 'Deals',
      active: (count: number) =>
        lang === 'ua' ? `Активних угод: ${count}` : `Active deals: ${count}`,
    },
    won: {
      title: lang === 'ua' ? 'Виграні угоди' : 'Won Deals',
      winRate: (pct: number) =>
        lang === 'ua' ? `Коефіцієнт конверсії: ${pct}%` : `Win rate: ${pct}%`,
      zero: lang === 'ua' ? 'Немає закритих угод' : 'No closed deals',
    },
  },

  // Dashboard section titles
  dashboard: {
    goalsTitle: lang === 'ua' ? 'Фінансові цілі' : 'Financial Goals',
    configureGoal: lang === 'ua' ? 'Налаштувати ціль' : 'Configure Goal',
    chartsTitle: lang === 'ua' ? 'Аналітика' : 'Analytics',
  },

  // KPI tiles
  kpi: {
    revenue: lang === 'ua' ? 'Отриманий дохід' : 'Revenue Achieved',
    wonDealsPeriod: (currency: string, period: string) => {
      const pStr = period === 'WEEK' ? (lang === 'ua' ? 'поточний тиждень' : 'current week') :
                   period === 'YEAR' ? (lang === 'ua' ? 'поточний рік' : 'current year') :
                   (lang === 'ua' ? 'поточний місяць' : 'current month');
      return lang === 'ua' ? `Виграні угоди за ${pStr} (${currency})` : `Won deals for ${pStr} (${currency})`;
    },
    target: lang === 'ua' ? 'Цільовий орієнтир' : 'Target Goal',
    achieved: lang === 'ua' ? 'Досягнуто' : 'Achieved',
    of: lang === 'ua' ? 'з' : 'of',
    planExecution: lang === 'ua' ? 'Виконання плану' : 'Plan Execution',
    planExecutionPeriod: (period: string) => {
      const pStr = period === 'WEEK' ? (lang === 'ua' ? 'тижневого' : 'weekly') :
                   period === 'YEAR' ? (lang === 'ua' ? 'річного' : 'yearly') :
                   (lang === 'ua' ? 'місячного' : 'monthly');
      return lang === 'ua' ? `Виконання ${pStr} плану` : `${pStr.charAt(0).toUpperCase() + pStr.slice(1)} plan execution`;
    },
    winRate: lang === 'ua' ? 'Коефіцієнт конверсії' : 'Win Rate',
    winRateDesc: (won: number, total: number) =>
      lang === 'ua'
        ? `${won} виграно з ${total} закритих.`
        : `${won} won out of ${total} closed`,
    avgDeal: lang === 'ua' ? 'Середній чек' : 'Avg. Deal Size',
    avgDealDesc: lang === 'ua' ? 'Середній бюджет угоди' : 'Average deal budget',
    pipelineTotal: lang === 'ua' ? 'Сума відкритих угод' : 'Active Pipeline',
    pipelineTotalDesc: lang === 'ua' ? 'Сума всіх відкритих угод' : 'Sum of open deals',
  },

  // Charts
  charts: {
    funnel: lang === 'ua' ? 'Воронка продажів' : 'Sales Funnel',
    funnelDesc: lang === 'ua' ? 'Кількість угод по етапах' : 'Deal count by status',
    pipelineValue: lang === 'ua' ? 'Цінність угод' : 'Pipeline Value',
    pipelineValueDesc: lang === 'ua' ? 'Загальний бюджет угод на кожному етапі' : 'Total budget per deal stage',
    winRateChart: lang === 'ua' ? 'Результати угод' : 'Deal Results',
    winRateChartDesc: lang === 'ua' ? 'Виграні проти програних угод' : 'Won vs Lost deals',
    tasksOverview: lang === 'ua' ? 'Задачі команди' : 'Team Tasks',
    tasksOverviewDesc: lang === 'ua' ? 'Розподіл задач за статусом' : 'Tasks by status',
    tasksTotal: lang === 'ua' ? 'Всього задач' : 'Total tasks',
    clientStatus: lang === 'ua' ? 'Клієнтська база' : 'Client Base',
    clientStatusDesc: lang === 'ua' ? 'Розподіл клієнтів за статусом' : 'Clients by lifecycle stage',
    noData: lang === 'ua' ? 'Немає даних.' : 'No data',
    budgetSum: lang === 'ua' ? 'Сума бюджету' : 'Budget Sum',
  },

  // Task status labels
  taskStatus: {
    PLANNED: lang === 'ua' ? 'Заплановано' : 'Planned',
    IN_WORK: lang === 'ua' ? 'В роботі' : 'In Progress',
    DONE: lang === 'ua' ? 'Виконано' : 'Done',
  },

  // Deal status labels
  dealStatus: {
    NEW: lang === 'ua' ? 'Нова' : 'New',
    QUALIFICATION: lang === 'ua' ? 'Кваліфікація' : 'Qualification',
    DELIVERY: lang === 'ua' ? 'Доставка' : 'Delivery',
    DONE: lang === 'ua' ? 'Виконано' : 'Done',
    LOST: lang === 'ua' ? 'Втрачено' : 'Lost',
  },

  // Client status labels
  clientStatus: {
    NEW: lang === 'ua' ? 'Новий лід' : 'New Leads',
    IN_WORK: lang === 'ua' ? 'В роботі' : 'In Progress',
    CLIENT: lang === 'ua' ? 'Клієнт' : 'Clients',
    ARCHIVED: lang === 'ua' ? 'Архів' : 'Archived',
  },

  // Reports banner
  reports: {
    title: lang === 'ua' ? 'Звіти та вивантаження даних' : 'Reports & Data Export',
    desc:
      lang === 'ua'
        ? 'Генеруйте CSV-звіти у фоновому режимі (воронка, угоди, клієнти). Завантажуйте після завершення.'
        : 'Generate CSV reports in background (funnel, deals, clients). Download when status is Completed.',
    button: lang === 'ua' ? 'Звіти' : 'Reports',
  },

  // Goals dialog
  goalsDialog: {
    title: lang === 'ua' ? 'Налаштування фінансових цілей' : 'Financial Goals Settings',
    desc:
      lang === 'ua'
        ? 'Оберіть базову валюту та період. Угоди в інших валютах будуть конвертуватися автоматично.'
        : 'Choose base currency and timeframe. Deals in other currencies are converted automatically.',
    targetAmount: lang === 'ua' ? 'Цільова сума' : 'Target Amount',
    baseCurrency: lang === 'ua' ? 'Базова валюта' : 'Base Currency',
    targetPeriod: lang === 'ua' ? 'Період цілі' : 'Goal Timeframe',
    save: lang === 'ua' ? 'Зберегти зміни' : 'Save Changes',
    cancel: lang === 'ua' ? 'Скасувати' : 'Cancel',
    periods: {
      WEEK: lang === 'ua' ? 'Тиждень' : 'Week',
      MONTH: lang === 'ua' ? 'Місяць' : 'Month',
      YEAR: lang === 'ua' ? 'Рік' : 'Year',
    },
    currencies: {
      USD: lang === 'ua' ? 'Долар (USD)' : 'Dollar (USD)',
      EUR: lang === 'ua' ? 'Євро (EUR)' : 'Euro (EUR)',
      GBP: lang === 'ua' ? 'Фунт (GBP)' : 'Pound (GBP)',
      UAH: lang === 'ua' ? 'Гривня (UAH)' : 'Hryvnia (UAH)',
    },
  },

  // Header
  header: {
    askAI: lang === 'ua' ? 'Запитати ШІ' : 'Ask AI',
    notifications: lang === 'ua' ? 'Сповіщення' : 'Notifications',
    noNotifications: lang === 'ua' ? 'Немає нових сповіщень' : 'No new notifications',
    markRead: lang === 'ua' ? 'Прочитано' : 'Mark Read',
    logout: lang === 'ua' ? 'Вийти' : 'Log out',
  },

  // Sidebar navigation
  nav: {
    home: lang === 'ua' ? 'Головна' : 'Home',
    clients: lang === 'ua' ? 'Клієнти' : 'Clients',
    deals: lang === 'ua' ? 'Угоди' : 'Deals',
    kanban: lang === 'ua' ? 'Канбан' : 'Kanban',
    chats: lang === 'ua' ? 'Чати' : 'Chats',
    mailing: lang === 'ua' ? 'Пошта' : 'Mailing',
  },

  // Clients page
  clientsPage: {
    title: lang === 'ua' ? 'Клієнти' : 'Clients',
    subtitle: lang === 'ua' ? 'Ваша база контактів та клієнтів.' : 'Your contacts and clients database.',
    total: lang === 'ua' ? 'Всього' : 'Total',
    searchPlaceholder: lang === 'ua' ? 'Пошук за ім\'ям чи компанією...' : 'Search by name or company...',
    addButton: lang === 'ua' ? 'Додати' : 'Add',
    newContact: lang === 'ua' ? 'Новий контакт' : 'New Contact',
    namePlaceholder: lang === 'ua' ? "Ім'я та Прізвище *" : 'Full Name *',
    companyPlaceholder: lang === 'ua' ? 'Компанія' : 'Company',
    phonePlaceholder: lang === 'ua' ? 'Телефон' : 'Phone',
    save: lang === 'ua' ? 'Зберегти' : 'Save',
    colClient: lang === 'ua' ? 'Клієнт' : 'Client',
    colContacts: lang === 'ua' ? 'Контакти' : 'Contacts',
    colCompany: lang === 'ua' ? 'Компанія' : 'Company',
    colStatus: lang === 'ua' ? 'Статус' : 'Status',
    notFound: lang === 'ua' ? 'Контактів не знайдено' : 'No contacts found',
    deleteConfirm: lang === 'ua' ? 'Ви впевнені, що хочете видалити цього клієнта?' : 'Are you sure you want to delete this client?',
    statusMap: {
      NEW: lang === 'ua' ? 'Новий' : 'New',
      IN_WORK: lang === 'ua' ? 'В роботі' : 'In Progress',
      CLIENT: lang === 'ua' ? 'Клієнт' : 'Client',
      ARCHIVED: lang === 'ua' ? 'Архів' : 'Archived',
    },
  },

  // Kanban page
  kanbanPage: {
    title: lang === 'ua' ? 'Канбан Дошка' : 'Kanban Board',
    subtitle: lang === 'ua' ? 'Перетягуйте задачі між колонками.' : 'Drag tasks between columns.',
    planned: lang === 'ua' ? 'Заплановано' : 'Planned',
    inWork: lang === 'ua' ? 'В роботі' : 'In Progress',
    done: lang === 'ua' ? 'Виконано' : 'Done',
    addTask: lang === 'ua' ? 'Додати задачу' : 'Add Task',
    noTasks: lang === 'ua' ? 'Немає задач' : 'No tasks',
  },

  // Deals page
  dealsPage: {
    title: lang === 'ua' ? 'Угоди' : 'Deals',
    subtitle: lang === 'ua' ? 'Керуйте угодами та воронкою продажів.' : 'Manage deals and sales pipeline.',
    addDeal: lang === 'ua' ? 'Нова угода' : 'New Deal',
    searchPlaceholder: lang === 'ua' ? 'Пошук угод...' : 'Search deals...',
    colTitle: lang === 'ua' ? 'Назва' : 'Title',
    colClient: lang === 'ua' ? 'Контакт' : 'Client',
    colBudget: lang === 'ua' ? 'Бюджет' : 'Budget',
    colStatus: lang === 'ua' ? 'Етап' : 'Status',
    colDate: lang === 'ua' ? 'Дата' : 'Date',
    notFound: lang === 'ua' ? 'Угод не знайдено' : 'No deals found',
    save: lang === 'ua' ? 'Зберегти' : 'Save',
    cancel: lang === 'ua' ? 'Скасувати' : 'Cancel',
    deleteConfirm: lang === 'ua' ? 'Видалити угоду?' : 'Delete deal?',
  },

  // Chat page (Facebook Messenger)
  chatPage: {
    title: lang === 'ua' ? 'Чати клієнтів' : 'Chats',
    subtitle: lang === 'ua' ? 'Повідомлення Facebook Messenger від клієнтів.' : 'Facebook Messenger messages from clients.',
    noChats: lang === 'ua' ? 'Немає активних чатів.' : 'No active chats',
    selectChat: lang === 'ua' ? 'Оберіть чат зліва' : 'Select a chat from the left',
    inputPlaceholder: lang === 'ua' ? 'Введіть ваше повідомлення...' : 'Write a message...',
    send: lang === 'ua' ? 'Надіслати' : 'Send',
    you: lang === 'ua' ? 'Ви' : 'You',
    unread: (n: number) => lang === 'ua' ? `${n} непрочитаних.` : `${n} unread`,
  },

  // Mailing page
  mailingPage: {
    title: lang === 'ua' ? 'Пошта' : 'Mailing',
    subtitle: lang === 'ua' ? 'Надсилайте електронні листи клієнтам.' : 'Send email campaigns to clients.',
    newEmail: lang === 'ua' ? 'Новий лист' : 'New Email',
    to: lang === 'ua' ? 'Кому' : 'To',
    subject: lang === 'ua' ? 'Тема' : 'Subject',
    body: lang === 'ua' ? 'Текст листа' : 'Message body',
    send: lang === 'ua' ? 'Надіслати' : 'Send',
    cancel: lang === 'ua' ? 'Скасувати' : 'Cancel',
    sent: lang === 'ua' ? 'Надіслано' : 'Sent',
    noHistory: lang === 'ua' ? 'Немає надісланих листів' : 'No sent emails',
  },

  // AI Assistant panel
  aiPanel: {
    title: lang === 'ua' ? 'ШІ Асистент' : 'AI Assistant',
    placeholder: lang === 'ua' ? 'Запитайте ШІ про що завгодно...' : 'Ask AI about anything...',
    send: lang === 'ua' ? 'Надіслати' : 'Send',
    thinking: lang === 'ua' ? 'Думаю...' : 'Thinking...',
    errorMsg: lang === 'ua' ? 'Виникла помилка. Спробуйте ще раз.' : 'An error occurred. Please try again.',
    greeting: lang === 'ua' ? 'Чим я можу допомогти вам сьогодні?' : 'How can I help you today?',
    selectModel: lang === 'ua' ? 'Виберіть модель' : 'Select model',
    clearHistory: lang === 'ua' ? 'Очистити історію' : 'Clear history',
    loadingHistory: lang === 'ua' ? 'Завантаження історії...' : 'Loading history...',
    errorConn: lang === 'ua' ? "Вибачте, сталася помилка при з'єднанні з сервером." : 'Sorry, an error occurred while connecting to the server.',
    requestCancelled: lang === 'ua' ? '⏹ Запит скасовано.' : '⏹ Request cancelled.',
    clear: lang === 'ua' ? 'Очистити' : 'Clear',
    cancelGeneration: lang === 'ua' ? 'Скасувати генерацію' : 'Cancel generation',
    recommendedClear: lang === 'ua' ? 'повідомлень. Рекомендуємо очистити історію для кращої роботи AI.' : 'messages. We recommend clearing history for better AI performance.',
  },
});
