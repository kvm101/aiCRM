package vasyl.karpliak.aiCRM.ai.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import vasyl.karpliak.aiCRM.sales.domain.Task;
import vasyl.karpliak.aiCRM.sales.service.TaskService;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.service.ClientService;

import vasyl.karpliak.aiCRM.ai.dto.TaskResponse;
import vasyl.karpliak.aiCRM.ai.dto.ClientResponse;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SalesAITools {

    private final TaskService taskService;
    private final ClientService clientService;
    private final vasyl.karpliak.aiCRM.sales.service.DealService dealService;

    public SalesAITools(TaskService taskService, ClientService clientService, vasyl.karpliak.aiCRM.sales.service.DealService dealService) {
        this.taskService = taskService;
        this.clientService = clientService;
        this.dealService = dealService;
    }

    private TaskResponse mapToTaskResponse(Task t) {
        return new TaskResponse(
            t.getId(), 
            t.getTitle(), 
            t.getDescription(), 
            t.getDeadline(), 
            t.getTag(),
            t.getDeal() != null ? t.getDeal().getId() : null,
            t.getDeal() != null ? t.getDeal().getTitle() : null,
            t.getClient() != null ? t.getClient().getId() : null,
            t.getClient() != null ? t.getClient().getName() : null,
            t.getType() != null ? t.getType().name() : null,
            t.getDueDate(),
            t.getResult()
        );
    }

    private ClientResponse mapToClientResponse(Client c) {
        return new ClientResponse(c.getId(), c.getName(), c.getEmail(), c.getPhone(), c.getCompany(), c.getStatus() != null ? c.getStatus().name() : null);
    }

    @Tool(description = "Отримати всі задачі (tasks) для конкретного користувача за його ID. Повертає список задач Kanban.")
    public List<TaskResponse> getAllTasks(Long userId) {
        return taskService.getAllTasks(userId).stream()
                .map(this::mapToTaskResponse)
                .collect(Collectors.toList());
    }
    
    @Tool(description = "Отримати список всіх клієнтів (контактів) з бази даних CRM. Параметр name необов'язковий.")
    public List<ClientResponse> getClients(
            Long userId,
            @ToolParam(required = false, description = "Фільтр за ім'ям клієнта (необов'язковий)") String name) {
        return clientService.getAllClients(userId, name).stream()
                .map(this::mapToClientResponse)
                .collect(Collectors.toList());
    }

    @Tool(description = "Створити нову задачу (task) в Kanban-дошці. ВАЖЛИВО: параметр tag повинен бути тільки 'PLANNED', 'IN_WORK' або 'DONE'. Параметри description, dealId та clientId необов'язкові.")
    public TaskResponse createTask(
            Long userId,
            String title,
            @ToolParam(required = false, description = "Опис задачі (необов'язковий)") String description,
            String tag,
            @ToolParam(required = false, description = "ID угоди для прив'язки (необов'язковий)") Long dealId,
            @ToolParam(required = false, description = "ID клієнта для прив'язки (необов'язковий)") Long clientId) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);
        
        // Примусово виправляємо теги, якщо AI за звичкою надішле "TODO"
        if (tag == null || tag.equalsIgnoreCase("TODO")) {
            tag = "PLANNED";
        } else if (tag.equalsIgnoreCase("IN_PROGRESS")) {
            tag = "IN_WORK";
        }
        
        task.setTag(tag);
        return mapToTaskResponse(taskService.createTask(task, userId, dealId, clientId));
    }

    @Tool(description = "Оновити статус (тег) задачі. Можливі значення: 'PLANNED', 'IN_WORK', 'DONE'.")
    public TaskResponse updateTaskStatus(Long userId, Long taskId, String newTag) {
        Task patch = new Task();
        patch.setTag(newTag);
        return mapToTaskResponse(taskService.updateTask(userId, taskId, patch, null, null));
    }

    @Tool(description = "Створити нового клієнта (контакт/лід) в CRM системі.")
    public ClientResponse createClient(
            Long userId,
            String name,
            @ToolParam(required = false, description = "Email клієнта (необов'язковий)") String email,
            @ToolParam(required = false, description = "Телефон клієнта (необов'язковий)") String phone,
            @ToolParam(required = false, description = "Компанія клієнта (необов'язковий)") String company) {
        Client client = new Client();
        client.setName(name);
        client.setEmail(email);
        client.setPhone(phone);
        client.setCompany(company);
        client.setStatus(vasyl.karpliak.aiCRM.sales.enums.ClientStatus.NEW);
        return mapToClientResponse(clientService.createClient(client, userId));
    }

    @Tool(description = "Оновити статус клієнта у воронці продажів. Можливі статуси: NEW, IN_PROGRESS, WON, LOST.")
    public ClientResponse updateClientStatus(Long userId, Long clientId, vasyl.karpliak.aiCRM.sales.enums.ClientStatus newStatus) {
        Client patch = new Client();
        patch.setStatus(newStatus);
        return mapToClientResponse(clientService.updateClient(userId, clientId, patch));
    }

    @Tool(description = "Редагувати існуючу задачу. Будь-який параметр може бути null, якщо його не потрібно змінювати. Формат дедлайну ISO, наприклад '2026-12-31T23:59:00'")
    public TaskResponse updateTaskDetails(
            Long userId,
            Long taskId,
            @ToolParam(required = false, description = "Нова назва задачі") String title,
            @ToolParam(required = false, description = "Новий опис задачі") String description,
            @ToolParam(required = false, description = "Дедлайн в ISO форматі") String deadlineIso,
            @ToolParam(required = false, description = "ID угоди для прив'язки") Long dealId,
            @ToolParam(required = false, description = "ID клієнта для прив'язки") Long clientId) {
        Task patch = new Task();
        patch.setTitle(title);
        patch.setDescription(description);
        if (deadlineIso != null && !deadlineIso.isBlank()) {
            try {
                patch.setDeadline(java.time.LocalDateTime.parse(deadlineIso));
            } catch (Exception e) {
                // Якщо AI передав неправильний формат, ігноруємо
            }
        }
        return mapToTaskResponse(taskService.updateTask(userId, taskId, patch, dealId, clientId));
    }

    @Tool(description = "Редагувати дані існуючого клієнта (контакту). Будь-який параметр може бути null, якщо його не потрібно змінювати.")
    public ClientResponse updateClientDetails(
            Long userId,
            Long clientId,
            @ToolParam(required = false, description = "Нове ім'я клієнта") String name,
            @ToolParam(required = false, description = "Новий email") String email,
            @ToolParam(required = false, description = "Новий телефон") String phone,
            @ToolParam(required = false, description = "Нова компанія") String company) {
        Client patch = new Client();
        patch.setName(name);
        patch.setEmail(email);
        patch.setPhone(phone);
        patch.setCompany(company);
        return mapToClientResponse(clientService.updateClient(userId, clientId, patch));
    }

    private vasyl.karpliak.aiCRM.ai.dto.DealResponse mapToDealResponse(vasyl.karpliak.aiCRM.sales.domain.Deal d) {
        return new vasyl.karpliak.aiCRM.ai.dto.DealResponse(
                d.getId(),
                d.getTitle(),
                d.getBudget(),
                d.getCurrency() != null ? d.getCurrency() : "USD",
                d.getStatus() != null ? d.getStatus().name() : null,
                d.getClient() != null ? d.getClient().getId() : null,
                d.getClient() != null ? d.getClient().getName() : null,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }

    @Tool(description = "Створити нову угоду (deal) з клієнтом. Бюджет (budget) має бути числовим значенням, валюта (currency) - 'UAH', 'USD', 'EUR', 'GBP'.")
    public vasyl.karpliak.aiCRM.ai.dto.DealResponse createDeal(
            Long userId,
            Long clientId,
            String title,
            java.math.BigDecimal budget,
            @ToolParam(required = false, description = "Валюта угоди, за замовчуванням USD") String currency) {
        vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest request = new vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest(title, budget, currency != null ? currency : "USD", clientId);
        return mapToDealResponse(dealService.createDeal(userId, request));
    }

    @Tool(description = "Отримати список всіх угод (deals) користувача. Повертає ID, назву, бюджет, валюту, статус та клієнта для кожної угоди.")
    public List<vasyl.karpliak.aiCRM.ai.dto.DealResponse> getDeals(Long userId) {
        return dealService.getAllDeals(userId).stream()
                .map(this::mapToDealResponse)
                .collect(Collectors.toList());
    }

    @Tool(description = "Отримати деталі конкретної угоди за її ID.")
    public vasyl.karpliak.aiCRM.ai.dto.DealResponse getDeal(Long userId, Long dealId) {
        return mapToDealResponse(dealService.getDeal(userId, dealId));
    }

    @Tool(description = "Оновити статус угоди. Можливі статуси: NEW, QUALIFICATION, DELIVERY, DONE, LOST.")
    public vasyl.karpliak.aiCRM.ai.dto.DealResponse updateDealStatus(Long userId, Long dealId, String newStatus) {
        vasyl.karpliak.aiCRM.sales.enums.DealStatus status = vasyl.karpliak.aiCRM.sales.enums.DealStatus.valueOf(newStatus.toUpperCase());
        return mapToDealResponse(dealService.changeStatus(userId, dealId, status));
    }

    @Tool(description = "Оновити деталі угоди (назву, бюджет, валюту). Будь-який параметр може бути null.")
    public vasyl.karpliak.aiCRM.ai.dto.DealResponse updateDealDetails(
            Long userId,
            Long dealId,
            @ToolParam(required = false, description = "Нова назва угоди") String title,
            @ToolParam(required = false, description = "Новий бюджет") java.math.BigDecimal budget,
            @ToolParam(required = false, description = "Нова валюта: UAH, USD, EUR, GBP") String currency) {
        vasyl.karpliak.aiCRM.sales.dto.DealUpdateRequest request = new vasyl.karpliak.aiCRM.sales.dto.DealUpdateRequest(title, budget, currency, null);
        return mapToDealResponse(dealService.updateDeal(userId, dealId, request));
    }

    @Tool(description = "Видалити угоду за її ID.")
    public String deleteDeal(Long userId, Long dealId) {
        dealService.deleteDeal(userId, dealId);
        return "Угоду #" + dealId + " успішно видалено.";
    }
}
