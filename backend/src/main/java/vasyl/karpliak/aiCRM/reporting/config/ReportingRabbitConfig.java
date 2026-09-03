package vasyl.karpliak.aiCRM.reporting.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ReportingRabbitConfig {

  public static final String REPORT_QUEUE = "report_generation_queue";
  public static final String REPORT_EXCHANGE = "reporting.exchange";

  @Bean
  public Queue reportGenerationQueue() {
    return new Queue(REPORT_QUEUE, true);
  }

  @Bean
  public DirectExchange reportingExchange() {
    return new DirectExchange(REPORT_EXCHANGE);
  }

  @Bean
  public Binding reportGenerationBinding(
      Queue reportGenerationQueue, DirectExchange reportingExchange) {
    return BindingBuilder.bind(reportGenerationQueue).to(reportingExchange).with(REPORT_QUEUE);
  }
}
