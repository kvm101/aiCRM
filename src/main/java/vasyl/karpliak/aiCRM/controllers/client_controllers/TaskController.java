package vasyl.karpliak.aiCRM.controllers.client_controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.dto.clientDTO.TaskDTO;

import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @PostMapping
    public ResponseEntity<TaskDTO> CreateTask() {

        return null;
    }

    @GetMapping("/filtered")
    public List<TaskDTO> ListOFTasks() {
        return null;
    }

    @GetMapping
    public ResponseEntity<TaskDTO> ReadTask() {
        return null;
    }

    @PutMapping
    public ResponseEntity<TaskDTO> UpdateTask() {
        return null;
    }

    @DeleteMapping
    public ResponseEntity<TaskDTO> DeleteTask() {
        return null;
    }

}
