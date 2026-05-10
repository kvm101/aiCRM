package vasyl.karpliak.aiCRM.reporting.service;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.reporting.config.ReportingRabbitConfig;
import vasyl.karpliak.aiCRM.reporting.domain.ReportTask;
import vasyl.karpliak.aiCRM.reporting.dto.ReportRequestDTO;
import vasyl.karpliak.aiCRM.reporting.dto.ReportTaskDTO;
import vasyl.karpliak.aiCRM.reporting.enums.ReportStatus;
import vasyl.karpliak.aiCRM.reporting.repository.ReportTaskRepository;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportingService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
    private static final String REPORT_DIR = System.getProperty("user.home") + "/aicrm-reports/";

    private final ReportTaskRepository reportTaskRepository;
    private final DealRepository dealRepository;
    private final ClientRepository clientRepository;
    private final RabbitTemplate rabbitTemplate;

    public ReportingService(ReportTaskRepository reportTaskRepository,
                            DealRepository dealRepository,
                            ClientRepository clientRepository,
                            RabbitTemplate rabbitTemplate) {
        this.reportTaskRepository = reportTaskRepository;
        this.dealRepository = dealRepository;
        this.clientRepository = clientRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public ReportTaskDTO requestReport(ReportRequestDTO request, Long projectId, Long userId) {
        ReportTask task = new ReportTask();
        task.setName(request.name());
        task.setType(request.type());
        task.setProjectId(projectId);
        task.setRequestedByUserId(userId);
        task.setStatus(ReportStatus.PENDING);
        reportTaskRepository.save(task);

        rabbitTemplate.convertAndSend(
                ReportingRabbitConfig.REPORT_EXCHANGE,
                ReportingRabbitConfig.REPORT_QUEUE,
                task.getId()
        );

        return toDTO(task);
    }

    public List<ReportTaskDTO> getReportsForProject(Long projectId) {
        return reportTaskRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void processReportTask(String taskId) {
        ReportTask task = reportTaskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return;
        }

        task.setStatus(ReportStatus.PROCESSING);
        reportTaskRepository.save(task);

        try {
            String filePath = generateCsv(task);
            task.setFilePath(filePath);
            task.setStatus(ReportStatus.COMPLETED);
            task.setCompletedAt(LocalDateTime.now());
        } catch (Exception e) {
            task.setStatus(ReportStatus.FAILED);
            task.setErrorMessage(e.getMessage());
        }
        reportTaskRepository.save(task);
    }

    private String generateCsv(ReportTask task) throws IOException {
        Files.createDirectories(Paths.get(REPORT_DIR));
        String fileName = task.getType().name() + "_" + LocalDateTime.now().format(FMT) + ".csv";
        Path filePath = Paths.get(REPORT_DIR + fileName);

        try (BufferedWriter writer = Files.newBufferedWriter(filePath);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT)) {
            switch (task.getType()) {
                case SALES_FUNNEL -> writeSalesFunnelCsv(printer, task.getProjectId());
                case REVENUE_GROWTH -> writeRevenueGrowthCsv(printer, task.getProjectId());
                case USER_ACTIVITY -> writeUserActivityCsv(printer, task.getProjectId());
                case CLIENT_RETENTION -> writeClientRetentionCsv(printer, task.getProjectId());
            }
        }
        return filePath.toString();
    }

    private void writeSalesFunnelCsv(CSVPrinter printer, Long projectId) throws IOException {
        printer.printRecord("Status", "Count");
        for (DealStatus status : DealStatus.values()) {
            long count = dealRepository.countByProjectIdAndStatus(projectId, status);
            printer.printRecord(status.name(), count);
        }
    }

    private void writeRevenueGrowthCsv(CSVPrinter printer, Long projectId) throws IOException {
        printer.printRecord("Title", "Budget", "Currency", "Status", "ClosedAt");
        List<Deal> deals = dealRepository.findByProjectIdAndStatus(projectId, DealStatus.DONE);
        for (Deal d : deals) {
            printer.printRecord(
                    nullToEmpty(d.getTitle()),
                    d.getBudget() != null ? d.getBudget().toPlainString() : "0",
                    d.getCurrency() != null ? d.getCurrency() : "USD",
                    d.getStatus() != null ? d.getStatus().name() : "",
                    d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : ""
            );
        }
    }

    private void writeUserActivityCsv(CSVPrinter printer, Long projectId) throws IOException {
        printer.printRecord("Title", "Status", "Client", "CreatedAt");
        List<Deal> deals = dealRepository.findByProjectId(projectId);
        for (Deal d : deals) {
            String clientName = d.getClient() != null ? d.getClient().getName() : "N/A";
            printer.printRecord(
                    nullToEmpty(d.getTitle()),
                    d.getStatus() != null ? d.getStatus().name() : "",
                    clientName,
                    d.getCreatedAt() != null ? d.getCreatedAt().toString() : ""
            );
        }
    }

    private void writeClientRetentionCsv(CSVPrinter printer, Long projectId) throws IOException {
        printer.printRecord("Name", "Company", "Email", "Status");
        List<Client> clients = clientRepository.findByProjectId(projectId);
        for (Client c : clients) {
            printer.printRecord(
                    nullToEmpty(c.getName()),
                    nullToEmpty(c.getCompany()),
                    nullToEmpty(c.getEmail()),
                    c.getStatus() != null ? c.getStatus().name() : ""
            );
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private ReportTaskDTO toDTO(ReportTask task) {
        boolean done = task.getStatus() == ReportStatus.COMPLETED && task.getFilePath() != null;
        String downloadUrl = done ? "/reports/" + task.getId() + "/download" : null;
        return new ReportTaskDTO(
                task.getId(),
                task.getName(),
                task.getType(),
                task.getStatus(),
                task.getProjectId(),
                task.getRequestedByUserId(),
                task.getCreatedAt(),
                task.getCompletedAt(),
                done,
                downloadUrl
        );
    }
}
