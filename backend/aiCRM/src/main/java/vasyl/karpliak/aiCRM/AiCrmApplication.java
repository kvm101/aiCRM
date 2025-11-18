package vasyl.karpliak.aiCRM;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AiCrmApplication {
	public static void main(String[] args) {
		SpringApplication.run(AiCrmApplication.class, args);
	}
}