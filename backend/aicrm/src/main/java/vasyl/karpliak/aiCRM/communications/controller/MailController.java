package vasyl.karpliak.aiCRM.communications.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.communications.domain.MailData;
import vasyl.karpliak.aiCRM.communications.dto.EmailMessageDto;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.communications.service.MailService;
import vasyl.karpliak.aiCRM.iam.service.UserService;

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
                                             @RequestHeader(name = "X-User-Id") String user_id) {

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

    @GetMapping("/folder/{folder}")
    public ResponseEntity<List<EmailMessageDto>> getFolderEmails(
            @PathVariable String folder,
            @RequestHeader(name = "X-User-Id") String userId,
            @RequestHeader(name = "X-User-Role", defaultValue = "USER") String userRole) {
        return ResponseEntity.ok(mailService.getFolderEmails(Long.parseLong(userId), folder.toUpperCase(), userRole));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markEmailAsRead(@PathVariable Long id) {
        mailService.markEmailAsRead(id);
        return ResponseEntity.ok().build();
    }
}
