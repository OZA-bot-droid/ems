package com.ems.member.common.handler;

import com.ems.member.common.domain.ErrorCode;
import com.ems.member.common.dto.APIErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public CustomAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // 인가 실패 handler -> 403
    // 인증은 됐지만 해당 API 접근 권한이 없으면 실행
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        ErrorCode errorCode = ErrorCode.FORBIDDEN;

        APIErrorResponse errorResponse = new APIErrorResponse(
                false,
                errorCode,
                "접근 권한이 없습니다.",
                errorCode.getStatus().value(),
                Instant.now(),
                request.getRequestURI(),
                null
        );

        response.setStatus(errorCode.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        // writeValue : Java 객체를 JSON으로 변환해서 특정 출력 대상에 바로 써주는 메서드
        // getWriter : HTTP 응답 본문에 문자열을 작성할 통로
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }
}
