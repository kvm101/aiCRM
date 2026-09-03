package vasyl.karpliak.aiCRM.communications.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vasyl.karpliak.aiCRM.communications.domain.EmailMessage;

public interface EmailMessageRepository extends JpaRepository<EmailMessage, Long> {
  List<EmailMessage> findByUserIdAndFolderOrderByTimestampDesc(Long userId, String folder);

  List<EmailMessage> findByFolderOrderByTimestampDesc(String folder);

  boolean existsByExternalMessageId(String externalMessageId);

  java.util.List<EmailMessage> findByExternalMessageIdIn(
      java.util.Collection<String> externalMessageIds);
}
