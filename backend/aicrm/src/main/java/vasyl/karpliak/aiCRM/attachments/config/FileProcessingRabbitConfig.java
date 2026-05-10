package vasyl.karpliak.aiCRM.attachments.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FileProcessingRabbitConfig {

    public static final String FILE_QUEUE = "file_processing_queue";
    public static final String FILE_EXCHANGE = "file.processing.exchange";

    @Bean
    public Queue fileProcessingQueue() {
        return new Queue(FILE_QUEUE, true);
    }

    @Bean
    public DirectExchange fileProcessingExchange() {
        return new DirectExchange(FILE_EXCHANGE);
    }

    @Bean
    public Binding fileProcessingBinding(Queue fileProcessingQueue, DirectExchange fileProcessingExchange) {
        return BindingBuilder.bind(fileProcessingQueue).to(fileProcessingExchange).with(FILE_QUEUE);
    }
}
