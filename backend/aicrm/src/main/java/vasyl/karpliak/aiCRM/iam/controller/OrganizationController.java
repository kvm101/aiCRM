package vasyl.karpliak.aiCRM.iam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.iam.domain.Organization;
import vasyl.karpliak.aiCRM.iam.domain.Project;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.OrganizationRepository;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/iam/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public OrganizationController(OrganizationRepository organizationRepository,
                                  ProjectRepository projectRepository,
                                  UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/my")
    public ResponseEntity<Organization> getMyOrganization(
            @RequestHeader(name = "X-User-Id", required = false) String headerUserId,
            @CookieValue(name = "user_id", required = false) String cookieUserId) {
        String userId = headerUserId != null ? headerUserId : cookieUserId;
        if (userId == null) return ResponseEntity.badRequest().build();
        
        Optional<User> userOpt = userRepository.findById(Long.parseLong(userId));
        if (userOpt.isPresent() && userOpt.get().getOrganization() != null) {
            return ResponseEntity.ok(userOpt.get().getOrganization());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/create")
    public ResponseEntity<Organization> createOrganization(
            @RequestHeader(name = "X-User-Id", required = false) String headerUserId,
            @CookieValue(name = "user_id", required = false) String cookieUserId,
            @RequestBody Organization orgData) {
        String userId = headerUserId != null ? headerUserId : cookieUserId;
        if (userId == null) return ResponseEntity.badRequest().build();
        
        Optional<User> userOpt = userRepository.findById(Long.parseLong(userId));
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        User user = userOpt.get();
        if (user.getOrganization() != null) {
            // User already has an organization — return it instead of error
            return ResponseEntity.ok(user.getOrganization());
        }

        Organization org = new Organization();
        org.setName(orgData.getName());
        org.setOwnerId(user.getId());
        Organization savedOrg = organizationRepository.save(org);

        user.setOrganization(savedOrg);
        userRepository.save(user);

        // Create default project
        Project defaultProject = new Project();
        defaultProject.setName("Основний проєкт");
        defaultProject.setOrganization(savedOrg);
        projectRepository.save(defaultProject);

        return ResponseEntity.ok(savedOrg);
    }
}
