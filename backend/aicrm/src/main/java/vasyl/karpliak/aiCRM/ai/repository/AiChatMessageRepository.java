package vasyl.karpliak.aiCRM.ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.ai.domain.AiChatMessage;

import java.util.List;

@Repository
public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {
    List<AiChatMessage> findByUserIdOrderByCreatedAtAsc(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
}
