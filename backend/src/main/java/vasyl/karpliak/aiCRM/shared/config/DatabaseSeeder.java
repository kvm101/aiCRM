package vasyl.karpliak.aiCRM.shared.config;

import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import vasyl.karpliak.aiCRM.communications.domain.ChatSession;
import vasyl.karpliak.aiCRM.communications.domain.Message;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;
import vasyl.karpliak.aiCRM.communications.enums.SenderType;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.communications.repository.MessageRepository;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.enums.UserRoles;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

@Component
public class DatabaseSeeder implements CommandLineRunner {

  private final UserRepository userRepository;
  private final ChatSessionRepository chatSessionRepository;
  private final MessageRepository messageRepository;

  @org.springframework.beans.factory.annotation.Value("${DEFAULT_USER_PASSWORD:password}")
  private String defaultUserPassword;

  public DatabaseSeeder(
      UserRepository userRepository,
      ChatSessionRepository chatSessionRepository,
      MessageRepository messageRepository) {
    this.userRepository = userRepository;
    this.chatSessionRepository = chatSessionRepository;
    this.messageRepository = messageRepository;
  }

  @Override
  public void run(String... args) {
    // Seed default Team Lead
    if (userRepository.count() == 0) {
      User teamLead = new User();
      teamLead.setName("Team Lead");
      teamLead.setLogin("teamlead");
      teamLead.setPassword(defaultUserPassword);
      teamLead.setEmail("teamlead@example.com");
      teamLead.setCompany("AI CRM Inc.");
      teamLead.setPhone("+380000000001");
      teamLead.setRole(UserRoles.ADMIN);
      User savedTeamLead = userRepository.save(teamLead);

      // Seed default Sales Rep
      User sales = new User();
      sales.setName("Sales Rep");
      sales.setLogin("sales");
      sales.setPassword(defaultUserPassword);
      sales.setEmail("sales@example.com");
      sales.setCompany("AI CRM Inc.");
      sales.setPhone("+380000000002");
      sales.setRole(UserRoles.MANAGER);
      userRepository.save(sales);

      // Seed a mock chat session
      ChatSession session = new ChatSession();
      session.setAssignedUserId(savedTeamLead.getId());
      session.setTeamId(1L);
      session.setChannelType(ChannelType.FACEBOOK);
      session.setExternalChatId("fb_12345");
      session.setStatus(SessionStatus.OPEN);
      ChatSession savedSession = chatSessionRepository.save(session);

      Message msg = new Message();
      msg.setSession(savedSession);
      msg.setSenderType(SenderType.CLIENT);
      msg.setText("Привіт! Я зацікавлений у ваших послугах, підкажіть ціну.");
      msg.setCreatedAt(LocalDateTime.now().minusMinutes(5));
      messageRepository.save(msg);
    }
  }
}
