package vn.hoidanit.JobZone.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import com.google.genai.Client;

@Configuration
public class GeminiConfig {

    @Bean
    public RestTemplate restTemplate(org.springframework.boot.web.client.RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(java.time.Duration.ofSeconds(5))
                .setReadTimeout(java.time.Duration.ofSeconds(30))
                .build();
    }

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Bean
    public Client geminiClient() {
        // Khởi tạo Client với API Key
        // SDK sẽ tự quản lý connection pool
        return Client.builder()
                .apiKey(geminiApiKey)
                .build();
    }

}
