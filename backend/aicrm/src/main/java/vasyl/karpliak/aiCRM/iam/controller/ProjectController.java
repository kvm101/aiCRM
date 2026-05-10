package vasyl.karpliak.aiCRM.iam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.iam.domain.Project;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/iam/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectController(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Project>> getMyProjects(
            @RequestHeader(name = "X-User-Id", required = false) String headerUserId,
            @CookieValue(name = "user_id", required = false) String cookieUserId) {
        String userId = headerUserId != null ? headerUserId : cookieUserId;
        if (userId == null) return ResponseEntity.ok(List.of());
        
        Optional<User> userOpt = userRepository.findById(Long.parseLong(userId));
        if (userOpt.isPresent() && userOpt.get().getOrganization() != null) {
            Long orgId = userOpt.get().getOrganization().getId();
            return ResponseEntity.ok(projectRepository.findByOrganizationId(orgId));
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(
            @RequestHeader(name = "X-User-Id", required = false) String headerUserId,
            @CookieValue(name = "user_id", required = false) String cookieUserId,
            @RequestBody Project projectData) {
        String userId = headerUserId != null ? headerUserId : cookieUserId;
        if (userId == null) return ResponseEntity.badRequest().build();
        
        Optional<User> userOpt = userRepository.findById(Long.parseLong(userId));
        if (userOpt.isEmpty() || userOpt.get().getOrganization() == null) {
            return ResponseEntity.badRequest().build();
        }

        Project project = new Project();
        project.setName(projectData.getName());
        project.setOrganization(userOpt.get().getOrganization());
        Project saved = projectRepository.save(project);
        
        return ResponseEntity.ok(saved);
    }
}
