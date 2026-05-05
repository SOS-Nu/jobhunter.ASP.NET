package vn.hoidanit.JobZone.config;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
@EnableCaching
public class CacheConfig {

        private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

        // Hàm tạo ObjectMapper cục bộ, chỉ dùng cho cache
        private ObjectMapper createRedisObjectMapper() {
                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

                // ========== BẬT LẠI Default Typing (An toàn) ==========
                // Cấu hình PolymorphicTypeValidator để chỉ cho phép các kiểu an toàn
                PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                                .allowIfSubType("vn.hoidanit.JobZone.") // Chỉ cho phép các class của project
                                .allowIfSubType("java.util.")
                                .allowIfSubType("java.lang.")
                                .allowIfSubType("java.time.")
                                .build();

                // Kích hoạt default typing với validator đã cấu hình
                mapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);
                // ========== KẾT THÚC SỬA ==========

                return mapper;
        }

        @Bean
        @Primary
        public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
                log.info(">>> Initializing CUSTOM RedisCacheManager with Default Typing ENABLED...");

                ObjectMapper redisObjectMapper = createRedisObjectMapper();
                GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(
                                redisObjectMapper);
                StringRedisSerializer stringSerializer = new StringRedisSerializer();

                RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofHours(1))
                                .serializeKeysWith(RedisSerializationContext.SerializationPair
                                                .fromSerializer(stringSerializer))
                                .serializeValuesWith(RedisSerializationContext.SerializationPair
                                                .fromSerializer(jsonSerializer))
                                .disableCachingNullValues();

                Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

                return RedisCacheManager.builder(connectionFactory)
                                .cacheDefaults(defaultConfig)
                                .withInitialCacheConfigurations(cacheConfigurations)
                                .initialCacheNames(Set.of("roles", "permissions",
                                                "user-security-timestamp", "user-permissions-v1",
                                                "allSkillNames", "dashboard_stats")) // <<< Thêm tên cache mới nếu
                                                                                     // bạn dùng
                                // @Cacheable
                                .build();
        }
}