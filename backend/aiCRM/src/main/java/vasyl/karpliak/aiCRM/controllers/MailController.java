package vasyl.karpliak.aiCRM.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.domain.MailData;
import vasyl.karpliak.aiCRM.domain.User;
import vasyl.karpliak.aiCRM.dto.MailDataReminderDTO;
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

    @PostMapping("/reminder")
    public ResponseEntity<MailData> Reminder(@RequestBody MailDataReminderDTO mailReminder,
                                             @CookieValue(name = "user_id") String user_id) {
        Optional<User> user = userService.getUserById(Long.parseLong(user_id));
        List<String> to = List.of(user.get().getEmail());
        MailData mailData = new MailData();
        mailData.setTo(to);
        mailData.setSubject(mailReminder.getSubject());
        mailData.setText(mailReminder.getText());
        mailData.setWhen(mailReminder.getWhen());

        mailService.SendToMail(mailData);

        return new ResponseEntity<>(mailData, HttpStatus.OK);
    }

    @PostMapping("/send")
    public ResponseEntity<MailData> SendTo(@RequestBody MailData mailData,
                                           @CookieValue(name = "user_id") String user_id) {

        Optional<User> user = userService.getUserById(Long.parseLong(user_id));
        if (!user.get().getEmail().isEmpty()) {
            mailData.setText(mailData.getText() + "\nfrom: " + user.get().getEmail());
            mailService.SendToMail(mailData);
            return new ResponseEntity<>(mailData, HttpStatus.OK);
        }  else {
            return new ResponseEntity<>(mailData, HttpStatus.NOT_FOUND);
        }
    }
}
