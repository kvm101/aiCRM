package vasyl.karpliak.aiCRM.iam.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.RedirectView;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/iam/oauth2/google")
public class OAuth2Controller {

    @Value("${spring.ai.google.client.id:${google.client.id:YOUR_CLIENT_ID}}")
    private String clientId;

    @Value("${spring.ai.google.client.secret:${google.client.secret:YOUR_CLIENT_SECRET}}")
    private String clientSecret;

    @Value("${spring.ai.google.redirect.uri:${google.redirect.uri:http://localhost:8080/iam/oauth2/google/callback}}")
    private String redirectUri;

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public OAuth2Controller(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/login")
    public RedirectView login(@RequestParam("userId") Long userId) {
        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + clientId +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode("https://mail.google.com/ openid email", StandardCharsets.UTF_8) +
                "&access_type=offline" +
                "&prompt=consent%20select_account" +
                "&state=" + userId;

        return new RedirectView(authUrl);
    }

    @GetMapping("/callback")
    public RedirectView callback(@RequestParam("code") String code, @RequestParam("state") String state) {
        Long userId = Long.parseLong(state);
        
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
                
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setGoogleAccessToken(accessToken);
                    if (refreshToken != null) {
                        user.setGoogleRefreshToken(refreshToken);
                    }
                    if (expiresIn != null) {
                        user.setGoogleTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn));
                    }
                    
                    // Fetch user's email from Google to save it
                    try {
                        String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
                        HttpHeaders userHeaders = new HttpHeaders();
                        userHeaders.setBearerAuth(accessToken);
                        HttpEntity<String> userRequest = new HttpEntity<>(userHeaders);
                        ResponseEntity<Map> userResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, userRequest, Map.class);
                        if (userResponse.getBody() != null) {
                            String email = (String) userResponse.getBody().get("email");
                            user.setGoogleEmail(email);
                        }
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                    
                    userRepository.save(user);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Повертаємось на фронтенд сторінку пошти
        return new RedirectView("http://localhost:3000/mailing"); 
    }
}
