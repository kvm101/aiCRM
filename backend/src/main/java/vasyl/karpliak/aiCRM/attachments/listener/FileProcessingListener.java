package vasyl.karpliak.aiCRM.attachments.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import vasyl.karpliak.aiCRM.attachments.config.FileProcessingRabbitConfig;
import vasyl.karpliak.aiCRM.attachments.service.FileAttachmentService;

@Component
public class FileProcessingListener {

  private final FileAttachmentService fileAttachmentService;

  public FileProcessingListener(FileAttachmentService fileAttachmentService) {
    this.fileAttachmentService = fileAttachmentService;
  }

  @RabbitListener(queues = FileProcessingRabbitConfig.FILE_QUEUE)
  public void onMessage(String attachmentIdStr) {
    long id = Long.parseLong(attachmentIdStr.trim());
    fileAttachmentService.processQueuedAttachment(id);
  }
}
