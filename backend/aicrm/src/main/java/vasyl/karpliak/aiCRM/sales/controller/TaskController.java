package vasyl.karpliak.aiCRM.sales.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.sales.domain.Task;
import vasyl.karpliak.aiCRM.sales.dto.TaskDTO;
import vasyl.karpliak.aiCRM.sales.service.TaskService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<TaskDTO> createTask(
            @RequestBody TaskDTO taskDTO,
            @RequestHeader(name = "X-Project-Id") String projectId,
            @RequestHeader(name = "X-User-Id") String userId) {

        Task task = dtoToEntity(taskDTO);
        Task createdTask = taskService.createTask(task, Long.parseLong(projectId), Long.parseLong(userId), taskDTO.getDealId(), taskDTO.getClientId());
        return new ResponseEntity<>(entityToDto(createdTask), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasks(
            @RequestHeader(name = "X-Project-Id", required = false) String projectIdStr) {

        Long projectId = resolveProjectId(projectIdStr);

        List<TaskDTO> tasks = taskService.getAllTasks(projectId)
                .stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    private Long resolveProjectId(String projectIdStr) {
        if (projectIdStr != null && !projectIdStr.isBlank()) {
            return Long.parseLong(projectIdStr);
        }
        return vasyl.karpliak.aiCRM.shared.context.RequestContextHelper.getCurrentProjectId();
    }

    @GetMapping("/filtered")
    public ResponseEntity<List<TaskDTO>> getTasksBeforeDeadline(
            @RequestParam("deadline") String deadlineStr,
            @RequestHeader(name = "X-Project-Id", required = false) String projectIdStr) {

        Long projectId = resolveProjectId(projectIdStr);
        LocalDateTime deadline = LocalDateTime.parse(deadlineStr);

        List<TaskDTO> tasks = taskService.getTasksBeforeDeadline(projectId, deadline)
                .stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTask(
            @PathVariable Long id,
            @RequestHeader(name = "X-Project-Id", required = false) String projectIdStr) {

        Long projectId = resolveProjectId(projectIdStr);
        Task task = taskService.getTask(projectId, id);
        return ResponseEntity.ok(entityToDto(task));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(
            @PathVariable Long id,
            @RequestBody TaskDTO taskDTO,
            @RequestHeader(name = "X-Project-Id") String projectIdStr) {

        Long projectId = Long.parseLong(projectIdStr);
        Task updatedTask = dtoToEntity(taskDTO);
        Task task = taskService.updateTask(projectId, id, updatedTask, taskDTO.getDealId(), taskDTO.getClientId());
        return ResponseEntity.ok(entityToDto(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @RequestHeader(name = "X-Project-Id") String projectIdStr) {

        Long projectId = Long.parseLong(projectIdStr);
        taskService.deleteTask(projectId, id);
        return ResponseEntity.noContent().build();
    }

    private Task dtoToEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDeadline(dto.getDeadline());
        task.setTag(dto.getTag());
        if (dto.getType() != null) {
            task.setType(vasyl.karpliak.aiCRM.sales.enums.TaskType.valueOf(dto.getType()));
        }
        task.setDueDate(dto.getDueDate() != null ? dto.getDueDate() : dto.getDeadline());
        task.setResult(dto.getResult());
        // Note: dealId mapping requires DealRepository, but we can skip it for update/create for now if not sent, 
        // or let TaskService handle Deal attachment. Currently we only create tasks with Deal attached from somewhere else.
        return task;
    }

    private TaskDTO entityToDto(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setDeadline(task.getDeadline());
        dto.setTag(task.getTag());
        dto.setDealId(task.getDeal() != null ? task.getDeal().getId() : null);
        dto.setDealTitle(task.getDeal() != null ? task.getDeal().getTitle() : null);
        dto.setClientId(task.getClient() != null ? task.getClient().getId() : null);
        dto.setClientName(task.getClient() != null ? task.getClient().getName() : null);
        dto.setType(task.getType() != null ? task.getType().name() : null);
        dto.setDueDate(task.getDueDate() != null ? task.getDueDate() : task.getDeadline());
        dto.setResult(task.getResult());
        return dto;
    }
}
