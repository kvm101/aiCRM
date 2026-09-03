package vasyl.karpliak.aiCRM.communications.service;

import org.springframework.context.ApplicationEvent;
import vasyl.karpliak.aiCRM.communications.domain.Message;

public class InboundMessageEvent extends ApplicationEvent {

  private static final long serialVersionUID = 1L;

  private final transient Message message;
  private final Long assignedUserId;

  public InboundMessageEvent(Object source, Message message, Long assignedUserId) {
    super(source);
    this.message = message;
    this.assignedUserId = assignedUserId;
  }

  public Message getMessage() {
    return message;
  }

  public Long getAssignedUserId() {
    return assignedUserId;
  }
}
