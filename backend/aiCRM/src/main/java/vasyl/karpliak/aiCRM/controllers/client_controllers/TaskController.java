package vasyl.karpliak.aiCRM.controllers.client_controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.domain.client_domain.Task;
import vasyl.karpliak.aiCRM.dto.clientDTO.TaskDTO;
import vasyl.karpliak.aiCRM.services.TaskService;

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
            @CookieValue(name = "user_id", required = true) String userId) {

        Task task = dtoToEntity(taskDTO);
        Task createdTask = taskService.createTask(task, Long.parseLong(userId));
        return new ResponseEntity<>(entityToDto(createdTask), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasks(
            @CookieValue(name = "user_id", required = true) String userIdStr) {

        Long userId = Long.parseLong(userIdStr);

        List<TaskDTO> tasks = taskService.getAllTasks(userId)
                .stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/filtered")
    public ResponseEntity<List<TaskDTO>> getTasksBeforeDeadline(
            @RequestParam("deadline") String deadlineStr,
            @CookieValue(name = "user_id", required = true) String userIdStr) {

        Long userId = Long.parseLong(userIdStr);
        LocalDateTime deadline = LocalDateTime.parse(deadlineStr);

        List<TaskDTO> tasks = taskService.getTasksBeforeDeadline(userId, deadline)
                .stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTask(
            @PathVariable Long id,
            @CookieValue(name = "user_id", required = true) String userIdStr) {

        Long userId = Long.parseLong(userIdStr);
        Task task = taskService.getTask(userId, id);
        return ResponseEntity.ok(entityToDto(task));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(
            @PathVariable Long id,
            @RequestBody TaskDTO taskDTO,
            @CookieValue(name = "user_id", required = true) String userIdStr) {

        Long userId = Long.parseLong(userIdStr);
        Task updatedTask = dtoToEntity(taskDTO);
        Task task = taskService.updateTask(userId, id, updatedTask);
        return ResponseEntity.ok(entityToDto(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @CookieValue(name = "user_id", required = true) String userIdStr) {

        Long userId = Long.parseLong(userIdStr);
        taskService.deleteTask(userId, id);
        return ResponseEntity.noContent().build();
    }

    private Task dtoToEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDeadline(dto.getDeadline());
        task.setTag(dto.getTag());
        return task;
    }

    private TaskDTO entityToDto(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setDeadline(task.getDeadline());
        dto.setTag(task.getTag());
        return dto;
    }
}
