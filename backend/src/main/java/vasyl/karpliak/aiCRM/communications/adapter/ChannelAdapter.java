package vasyl.karpliak.aiCRM.communications.adapter;

import vasyl.karpliak.aiCRM.communications.enums.ChannelType;

public interface ChannelAdapter {
  ChannelType getChannelType();

  // Sends a message back to the client (e.g., calls Telegram API)
  void sendMessage(String externalChatId, String text, String botToken);
}
