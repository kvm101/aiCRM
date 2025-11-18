package vasyl.karpliak.aiCRM.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.domain.MailData;
import vasyl.karpliak.aiCRM.domain.User;
import vasyl.karpliak.aiCRM.services.MailService;
import vasyl.karpliak.aiCRM.services.UserService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/mail")
public class MailController {
    MailService mailService;
    UserService userService;

    public MailController(MailService mailService, UserService userService) {
        this.mailService = mailService;
        this.userService = userService;
    }


    @PostMapping("/mail")
    public ResponseEntity<MailData> SendMail(@RequestBody MailData mailData,
                                             @CookieValue(name = "user_id") String user_id) {

        Optional<User> userOpt = userService.getUserById(Long.parseLong(user_id));

        userOpt.ifPresent(
                user -> {
                    mailService.SendToMail(mailData, user.getEmail());
                }
        );

        return userOpt.isPresent()
                ? new ResponseEntity<>(mailData, HttpStatus.OK)
                : ResponseEntity.notFound().build();
    }
}
