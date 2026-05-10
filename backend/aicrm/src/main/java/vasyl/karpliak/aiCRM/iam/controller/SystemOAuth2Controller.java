package vasyl.karpliak.aiCRM.iam.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.RedirectView;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.domain.Organization;
import vasyl.karpliak.aiCRM.iam.domain.Project;
import vasyl.karpliak.aiCRM.iam.enums.UserRoles;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.iam.repository.OrganizationRepository;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;

import jakarta.servlet.http.HttpServletResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/auth/oauth2/google")
public class SystemOAuth2Controller {

    @Value("${spring.ai.google.client.id:${google.client.id:YOUR_CLIENT_ID}}")
    private String clientId;

    @Value("${spring.ai.google.client.secret:${google.client.secret:YOUR_CLIENT_SECRET}}")
    private String clientSecret;

    @Value("${google.redirect.system.uri:http://localhost:8080/auth/oauth2/google/callback}")
    private String redirectUri;

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public SystemOAuth2Controller(UserRepository userRepository, 
                                  OrganizationRepository organizationRepository,
                                  ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/login")
    public RedirectView login() {
        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + clientId +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode("https://mail.google.com/ openid email profile", StandardCharsets.UTF_8) +
                "&access_type=offline" +
                "&prompt=consent%20select_account";

        return new RedirectView(authUrl);
    }

    @GetMapping("/callback")
    public RedirectView callback(@RequestParam("code") String code, HttpServletResponse httpResponse) {
        String tokenUrl = "https://oauth2.googleapis.com/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String body = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&grant_type=authorization_code";
                
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && responseBody.containsKey("access_token")) {
                String accessToken = (String) responseBody.get("access_token");
                String refreshToken = (String) responseBody.get("refresh_token");
                Integer expiresIn = (Integer) responseBody.get("expires_in");
                
                // Fetch user profile from Google
                String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
                HttpHeaders userHeaders = new HttpHeaders();
                userHeaders.setBearerAuth(accessToken);
                HttpEntity<String> userRequest = new HttpEntity<>(userHeaders);
                ResponseEntity<Map> userResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, userRequest, Map.class);
                
                if (userResponse.getBody() != null) {
                    String email = (String) userResponse.getBody().get("email");
                    String name = (String) userResponse.getBody().get("name");
                    
                    if (email != null) {
                        // Check if user exists, if not create one (Registration)
                        Optional<User> existingUser = userRepository.findAll().stream()
                                .filter(u -> email.equals(u.getEmail()) || email.equals(u.getGoogleEmail()))
                                .findFirst();
                                
                        User user;
                        if (existingUser.isPresent()) {
                            user = existingUser.get();
                        } else {
                            // Register new user
                            user = new User();
                            user.setEmail(email);
                            user.setGoogleEmail(email);
                            user.setName(name != null ? name : email);
                            // Auto-generate required fields
                            user.setLogin(email);
                            user.setPassword(UUID.randomUUID().toString());
                            user.setCompany("N/A");
                            user.setPhone("N/A");
                            user.setRole(UserRoles.MANAGER); // Default role for testing
                            
                            userRepository.save(user); // Save early to get ID

                            Organization org = new Organization();
                            org.setName(name != null ? name + " Org" : "My Organization");
                            org.setOwnerId(user.getId());
                            Organization savedOrg = organizationRepository.save(org);
                            
                            Project proj = new Project();
                            proj.setName("Default Project");
                            proj.setOrganization(savedOrg);
                            projectRepository.save(proj);

                            user.setOrganization(savedOrg);
                        }
                        
                        // Update Google tokens
                        user.setGoogleAccessToken(accessToken);
                        if (refreshToken != null) {
                            user.setGoogleRefreshToken(refreshToken);
                        }
                        if (expiresIn != null) {
                            user.setGoogleTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn));
                        }
                        
                        userRepository.save(user);
                        
                        // Create login cookie
                        ResponseCookie cookie = ResponseCookie.from("user_id", Long.toString(user.getId()))
                                .path("/")
                                .httpOnly(false) // So frontend can read it if needed, or keep httpOnly and add a /me endpoint
                                .maxAge(3600 * 24 * 7) // 7 days
                                .build();
                                
                        httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Redirect to dashboard
        return new RedirectView("http://localhost:3000/");
    }
}
