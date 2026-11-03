package com.ems.event.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger(OpenAPI) 문서 설정.
 * 서버 실행 후 http://localhost:8082/swagger-ui.html 에서 확인한다.
 */
@Configuration
public class OpenApiConfig {
//http://localhost:8082/swagger-ui.html
    @Bean
    public OpenAPI eventServiceOpenApi() {
        return new OpenAPI().info(new Info()
                .title("EMS Event Service API")
                .version("0.1.0")
                .description("""
                        행사(Event)와 세션(Session) API.
                        - 생성은 관리자, 수정·삭제·세션 관리는 그 행사를 만든 관리자만: 헤더 X-Member-Id, X-User-Role=ADMIN
                        - 조회는 누구나 가능. 단, DRAFT 행사와 화상 회의 링크는 그 행사를 만든 관리자에게만 보임
                        - 시간은 UTC ISO-8601 (예: 2026-11-01T05:00:00Z = 한국 시간 14:00)
                        """));
    }
}
