package vasyl.karpliak.aiCRM.communications.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class RabbitMQConfig {

    public static final String INBOUND_QUEUE = "inbound.messages.queue";
    public static final String OUTBOUND_QUEUE = "outbound.messages.queue";
    public static final String EXCHANGE = "communications.exchange";

    @Bean
    public Queue inboundQueue() {
        return new Queue(INBOUND_QUEUE, true); // durable
    }

    @Bean
    public Queue outboundQueue() {
        return new Queue(OUTBOUND_QUEUE, true); // durable
    }

    @Bean
    public DirectExchange communicationsExchange() {
        return new DirectExchange(EXCHANGE);
    }

    @Bean
    public Binding inboundBinding(Queue inboundQueue, DirectExchange communicationsExchange) {
        return BindingBuilder.bind(inboundQueue).to(communicationsExchange).with(INBOUND_QUEUE);
    }

    @Bean
    public Binding outboundBinding(Queue outboundQueue, DirectExchange communicationsExchange) {
        return BindingBuilder.bind(outboundQueue).to(communicationsExchange).with(OUTBOUND_QUEUE);
    }

    @Bean
    @Primary
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        // Використовуємо ObjectMapper зі Spring для коректної серіалізації LocalDateTime та інших типів
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
