package vasyl.karpliak.aiCRM.controllers;

import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Home {

    @GetMapping("/login/google")
    public String user(OAuth2AuthenticationToken principal) {
        return principal.getPrincipal().getAttribute("name");
    }
}
