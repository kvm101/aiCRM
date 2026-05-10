package vasyl.karpliak.aiCRM.attachments.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vasyl.karpliak.aiCRM.attachments.domain.FileAttachment;

import java.util.List;
import java.util.Optional;

public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {

    List<FileAttachment> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<FileAttachment> findByIdAndProjectId(Long id, Long projectId);
}
