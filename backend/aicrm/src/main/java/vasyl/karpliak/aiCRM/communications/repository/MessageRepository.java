package vasyl.karpliak.aiCRM.communications.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.communications.domain.Message;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
    List<Message> findByCreatedAtAfterOrderByCreatedAtAsc(LocalDateTime since);

    @Transactional
    @Modifying
    void deleteBySessionId(Long sessionId);
}
