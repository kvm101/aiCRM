package vasyl.karpliak.aiCRM.communications.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.communications.domain.Bot;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;

import java.util.Optional;

@Repository
public interface BotRepository extends JpaRepository<Bot, Long> {
    Optional<Bot> findByTeamIdAndChannelType(Long teamId, ChannelType channelType);
}
