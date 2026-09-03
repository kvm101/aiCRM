package vasyl.karpliak.aiCRM.communications.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.communications.domain.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
  List<Message> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

  List<Message> findByCreatedAtAfterOrderByCreatedAtAsc(LocalDateTime since);

  @Transactional
  @Modifying
  void deleteBySessionId(Long sessionId);
}
