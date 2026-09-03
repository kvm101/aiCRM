package vasyl.karpliak.aiCRM.communications.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.communications.domain.Bot;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;

@Repository
public interface BotRepository extends JpaRepository<Bot, Long> {
  Optional<Bot> findByTeamIdAndChannelType(Long teamId, ChannelType channelType);
}
