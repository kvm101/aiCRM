package vasyl.karpliak.aiCRM.communications.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.communications.domain.ChatSession;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findByExternalChatIdAndChannelTypeAndTeamId(String externalChatId, ChannelType channelType, Long teamId);
    List<ChatSession> findByAssignedUserId(Long assignedUserId);
    long countByStatus(SessionStatus status);
}
