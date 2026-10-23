package com.ems.event.common;

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

    @Bean
    public OpenAPI eventServiceOpenApi() {
        return new OpenAPI().info(new Info()
                .title("EMS Event Service API")
                .version("0.1.0")
                .description("""
                        행사(Event)와 세션(Session) API.
                        - 생성·수정·삭제는 관리자만 가능: 헤더 X-User-Id(회원 번호), X-User-Role=ADMIN 필요
                        - 조회는 누구나 가능. 단, 관리자가 아니면 DRAFT 행사와 화상 회의 링크는 보이지 않음
                        - 시간은 UTC ISO-8601 (예: 2026-11-01T05:00:00Z = 한국 시간 14:00)
                        """));
    }
}
