package vasyl.karpliak.aiCRM.shared.config;

import java.sql.Connection;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PgVectorExtensionInitializer implements ApplicationListener<ContextRefreshedEvent> {

  private static final Logger log = LoggerFactory.getLogger(PgVectorExtensionInitializer.class);

  private final DataSource dataSource;
  private final AtomicBoolean executed = new AtomicBoolean(false);

  public PgVectorExtensionInitializer(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @Override
  public void onApplicationEvent(ContextRefreshedEvent event) {
    if (event.getApplicationContext().getParent() != null) {
      return;
    }
    if (!executed.compareAndSet(false, true)) {
      return;
    }
    try (Connection connection = dataSource.getConnection();
        Statement statement = connection.createStatement()) {
      log.info("Initializing PgVector extension and vector_store schema...");
      statement.execute("CREATE EXTENSION IF NOT EXISTS vector");
      statement.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
      statement.execute(
          "CREATE TABLE IF NOT EXISTS vector_store ("
              + "id uuid DEFAULT uuid_generate_v4 () PRIMARY KEY, "
              + "content text, "
              + "metadata json, "
              + "embedding vector(768))");
      log.info("Successfully initialized vector_store schema.");
    } catch (Exception e) {
      log.warn("Could not run CREATE EXTENSION vector: {}", e.getMessage());
    }
  }
}
