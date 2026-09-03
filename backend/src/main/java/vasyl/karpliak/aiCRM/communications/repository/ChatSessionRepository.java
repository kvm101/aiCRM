package vasyl.karpliak.aiCRM.communications.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.communications.domain.ChatSession;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
  Optional<ChatSession> findByExternalChatIdAndChannelTypeAndTeamId(
      String externalChatId, ChannelType channelType, Long teamId);

  List<ChatSession> findByAssignedUserId(Long assignedUserId);

  List<ChatSession> findByProjectId(Long projectId);

  long countByStatus(SessionStatus status);

  long countByStatusAndProjectId(SessionStatus status, Long projectId);

  long countByProjectId(Long projectId);
}
