package vasyl.karpliak.aiCRM.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .info(
            new Info()
                .title("aiCRM API Documentation")
                .version("1.0.0")
                .description(
                    "Інтерактивна специфікація та документація API для системи aiCRM (IAM, Sales, Communications, AI).")
                .contact(
                    new Contact().name("Vasyl Karpliak").email("vasyl.karpliak.pp.2022@lpnu.ua")));
  }
}
