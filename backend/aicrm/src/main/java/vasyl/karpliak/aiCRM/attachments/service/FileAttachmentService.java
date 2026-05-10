package vasyl.karpliak.aiCRM.attachments.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import vasyl.karpliak.aiCRM.attachments.config.FileProcessingRabbitConfig;
import vasyl.karpliak.aiCRM.attachments.domain.FileAttachment;
import vasyl.karpliak.aiCRM.attachments.dto.FileAttachmentDTO;
import vasyl.karpliak.aiCRM.attachments.enums.FileAttachmentStatus;
import vasyl.karpliak.aiCRM.attachments.repository.FileAttachmentRepository;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealEventRepository;
import vasyl.karpliak.aiCRM.sales.repository.TaskRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileAttachmentService {

    private static final String UPLOAD_DIR = System.getProperty("user.home") + "/aicrm-uploads/";

    private final FileAttachmentRepository fileAttachmentRepository;
    private final DealEventRepository dealEventRepository;
    private final TaskRepository taskRepository;
    private final ClientRepository clientRepository;
    private final RabbitTemplate rabbitTemplate;
    private final FileTextExtractor fileTextExtractor;
    private final ObjectProvider<VectorStore> vectorStoreProvider;
    private final boolean vectorIndexingEnabled;

    public FileAttachmentService(FileAttachmentRepository fileAttachmentRepository,
                                 DealEventRepository dealEventRepository,
                                 TaskRepository taskRepository,
                                 ClientRepository clientRepository,
                                 RabbitTemplate rabbitTemplate,
                                 FileTextExtractor fileTextExtractor,
                                 ObjectProvider<VectorStore> vectorStoreProvider,
                                 @Value("${aicrm.attachments.vector-indexing.enabled:false}") boolean vectorIndexingEnabled) {
        this.fileAttachmentRepository = fileAttachmentRepository;
        this.dealEventRepository = dealEventRepository;
        this.taskRepository = taskRepository;
        this.clientRepository = clientRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.fileTextExtractor = fileTextExtractor;
        this.vectorStoreProvider = vectorStoreProvider;
        this.vectorIndexingEnabled = vectorIndexingEnabled;
    }

    @Transactional(readOnly = true)
    public List<FileAttachmentDTO> listForProject(Long projectId) {
        return fileAttachmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id, Long projectId) {
        FileAttachment attachment = fileAttachmentRepository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не знайдено"));
        String storedPath = attachment.getStoredPath();
        fileAttachmentRepository.delete(attachment);
        if (StringUtils.hasText(storedPath)) {
            try {
                Files.deleteIfExists(Path.of(storedPath));
            } catch (IOException ignored) {
                // запис у БД вже видалено; файл прибрати через адмін-панель або окремий job
            }
        }
    }

    @Transactional
    public FileAttachmentDTO upload(MultipartFile file,
                                    Long projectId,
                                    Long dealEventId,
                                    Long taskId,
                                    Long clientId,
                                    Integer clientNoteIndex) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        int targetsCount = 0;
        if (dealEventId != null) targetsCount++;
        if (taskId != null) targetsCount++;
        if (clientId != null || clientNoteIndex != null) targetsCount++;
        if (targetsCount != 1) {
            throw new IllegalArgumentException("Specify exactly one target: dealEventId, taskId, or clientId+clientNoteIndex");
        }

        if (dealEventId != null) {
            dealEventRepository.findByIdAndDeal_Project_Id(dealEventId, projectId)
                    .orElseThrow(() -> new RuntimeException("Подію угоди не знайдено або доступ заборонено"));
        } else if (taskId != null) {
            taskRepository.findByIdAndProjectId(taskId, projectId)
                    .orElseThrow(() -> new RuntimeException("Завдання не знайдено або доступ заборонено"));
        } else {
            if (clientId == null || clientNoteIndex == null) {
                throw new IllegalArgumentException("Both clientId and clientNoteIndex are required for client note attachment");
            }
            Client client = clientRepository.findByIdAndProjectId(clientId, projectId)
                    .orElseThrow(() -> new RuntimeException("Клієнта не знайдено або доступ заборонено"));
            if (clientNoteIndex < 0 || client.getNotes() == null || clientNoteIndex >= client.getNotes().size()) {
                throw new IllegalArgumentException("clientNoteIndex is out of range");
            }
        }

        Files.createDirectories(Paths.get(UPLOAD_DIR));
        String original = StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "upload.bin";
        String storedName = UUID.randomUUID() + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path target = Paths.get(UPLOAD_DIR, storedName);
        file.transferTo(target);

        FileAttachment attachment = new FileAttachment();
        attachment.setOriginalFilename(original);
        attachment.setContentType(file.getContentType());
        attachment.setFileSizeBytes(file.getSize());
        attachment.setStoredPath(target.toAbsolutePath().toString());
        attachment.setStatus(FileAttachmentStatus.PENDING);
        attachment.setProjectId(projectId);
        if (dealEventId != null) {
            attachment.setDealEvent(dealEventRepository.getReferenceById(dealEventId));
        }
        if (taskId != null) {
            attachment.setTask(taskRepository.getReferenceById(taskId));
        }
        if (clientId != null) {
            attachment.setClientId(clientId);
        }
        if (clientNoteIndex != null) {
            attachment.setClientNoteIndex(clientNoteIndex);
        }
        fileAttachmentRepository.save(attachment);

        rabbitTemplate.convertAndSend(
                FileProcessingRabbitConfig.FILE_EXCHANGE,
                FileProcessingRabbitConfig.FILE_QUEUE,
                attachment.getId().toString()
        );

        return toDto(attachment);
    }

    @Transactional
    public void processQueuedAttachment(long attachmentId) {
        FileAttachment attachment = fileAttachmentRepository.findById(attachmentId).orElse(null);
        if (attachment == null) {
            return;
        }

        attachment.setStatus(FileAttachmentStatus.PROCESSING);
        attachment.setProcessingError(null);
        fileAttachmentRepository.save(attachment);

        try {
            Path path = Path.of(attachment.getStoredPath());
            if (!Files.exists(path)) {
                throw new IOException("Stored file missing: " + path);
            }

            String text = fileTextExtractor.extract(path);
            if (!StringUtils.hasText(text)) {
                throw new IllegalStateException("No extractable text from file");
            }

            // Без зовнішніх embeddings: за замовчуванням просто вважаємо файл обробленим.
            // Якщо в майбутньому потрібно — увімкніть aicrm.attachments.vector-indexing.enabled=true
            // і поверніть PgVectorStoreAutoConfiguration в application.yaml.
            if (vectorIndexingEnabled) {
                VectorStore vectorStore = vectorStoreProvider.getIfAvailable();
                if (vectorStore != null) {
                    Document root = new Document(text, buildMetadata(attachment));
                    TokenTextSplitter splitter = new TokenTextSplitter();
                    List<Document> chunks = splitter.apply(List.of(root));
                    vectorStore.add(chunks);
                }
            }

            attachment.setStatus(FileAttachmentStatus.INDEXED);
        } catch (Exception e) {
            attachment.setStatus(FileAttachmentStatus.FAILED);
            attachment.setProcessingError(e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }
        fileAttachmentRepository.save(attachment);
    }

    private Map<String, Object> buildMetadata(FileAttachment attachment) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("attachmentId", attachment.getId().toString());
        meta.put("projectId", attachment.getProjectId().toString());
        meta.put("filename", attachment.getOriginalFilename());
        if (attachment.getDealEvent() != null) {
            meta.put("dealEventId", attachment.getDealEvent().getId().toString());
            if (attachment.getDealEvent().getDeal() != null) {
                meta.put("dealId", attachment.getDealEvent().getDeal().getId().toString());
            }
        }
        if (attachment.getTask() != null) {
            meta.put("taskId", attachment.getTask().getId().toString());
        }
        if (attachment.getClientId() != null) {
            meta.put("clientId", attachment.getClientId().toString());
        }
        if (attachment.getClientNoteIndex() != null) {
            meta.put("clientNoteIndex", attachment.getClientNoteIndex().toString());
        }
        return meta;
    }

    private FileAttachmentDTO toDto(FileAttachment a) {
        return new FileAttachmentDTO(
                a.getId(),
                a.getOriginalFilename(),
                a.getContentType(),
                a.getFileSizeBytes(),
                a.getStatus(),
                a.getProjectId(),
                a.getDealEvent() != null ? a.getDealEvent().getId() : null,
                a.getTask() != null ? a.getTask().getId() : null,
                a.getClientId(),
                a.getClientNoteIndex(),
                a.getProcessingError(),
                a.getCreatedAt()
        );
    }
}
