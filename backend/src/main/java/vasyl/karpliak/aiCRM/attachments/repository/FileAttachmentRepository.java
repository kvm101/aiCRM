package vasyl.karpliak.aiCRM.attachments.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vasyl.karpliak.aiCRM.attachments.domain.FileAttachment;

public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {

  List<FileAttachment> findByProjectIdOrderByCreatedAtDesc(Long projectId);

  Optional<FileAttachment> findByIdAndProjectId(Long id, Long projectId);
}
