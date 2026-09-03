package vasyl.karpliak.aiCRM.communications.dto;

import java.time.LocalDateTime;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;

public record UnifiedMessage(
    String externalId, // e.g., Facebook message ID
    String externalChatId, // e.g., Facebook User ID or Email address
    ChannelType channel, // Source platform
    Long teamId, // Identified tenant/team
    String text, // Message payload
    vasyl.karpliak.aiCRM.communications.enums.SenderType senderType, // CLIENT, OPERATOR, AI
    LocalDateTime timestamp) {}
