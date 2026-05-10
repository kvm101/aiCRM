package vasyl.karpliak.aiCRM.reporting.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.reporting.config.ReportingRabbitConfig;
import vasyl.karpliak.aiCRM.reporting.service.ReportingService;

@Component
public class ReportGenerationListener {

    private final ReportingService reportingService;

    public ReportGenerationListener(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @RabbitListener(queues = ReportingRabbitConfig.REPORT_QUEUE)
    @Transactional
    public void onReportJob(String taskId) {
        reportingService.processReportTask(taskId);
    }
}
