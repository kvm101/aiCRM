package vasyl.karpliak.aiCRM.communications.adapter;

import org.springframework.stereotype.Component;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;

/**
 * Placeholder for the Facebook Messenger adapter.
 *
 * <p>Facebook Messenger integration is not yet implemented. This stub exists so that the {@link
 * ChannelType#FACEBOOK} enum value is registered in the adapter map without causing a startup
 * failure. Both methods throw {@link UnsupportedOperationException} until the real integration is
 * built.
 */
@Component
public class FacebookAdapter implements ChannelAdapter {

  @Override
  public void sendMessage(String externalChatId, String text, String botToken) {
    throw new UnsupportedOperationException(
        "Facebook Messenger integration is not implemented yet.");
  }

  @Override
  public ChannelType getChannelType() {
    return ChannelType.FACEBOOK;
  }
}
