package com.ems.member.common.handler;

import com.ems.member.common.domain.ErrorCode;
import com.ems.member.common.dto.APIErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // 인증 실패 handler -> 401
    // 인증되지 않은 사용자가 인증 필요한 API 호출
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // AuthenticationException : 인증 실패 예외들의 부모 타입

        String message;
        ErrorCode errorCode;

        // 만료 혹은 변조된 accessToken
        // OAuth2AuthenticationException : OAuth2 인증 실패를 나타내는 구체적인 하위 예외
        if(authException instanceof OAuth2AuthenticationException oauthException
                && "invalid_token".equals(oauthException.getError().getErrorCode())) {

            errorCode = ErrorCode.INVALID_TOKEN;
            message = "유효하지 않은 AccessToken입니다.";

        } else {
            // accessToken 없음
            errorCode = ErrorCode.UNAUTHORIZED;
            message = "인증이 필요합니다.";
        }

        APIErrorResponse errorResponse = new APIErrorResponse(
                false,
                errorCode,
                message,
                errorCode.getStatus().value(),
                Instant.now(),
                request.getRequestURI(),
                null
        );

        response.setStatus(errorCode.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        objectMapper.writeValue(response.getWriter(), errorResponse);
    }
}
