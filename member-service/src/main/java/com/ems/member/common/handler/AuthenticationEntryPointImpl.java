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

/*
    Spring Security의 인증 실패를 처리하는 Handler

    인증이 필요한 API에 유효한 인증 정보 없이 접근하면 실행된다.
    인증 실패와 관련된 예외를 받아 HTTP 401 Unauthorized 응답을 반환한다.

    JWT 검증 과정에서 invalid_token 오류가 발생하면
    INVALID_TOKEN을 반환하고, 그 외 인증 실패는 UNAUTHORIZED로 처리한다.

    Spring Security 필터 단계에서 발생하는 인증 예외를 처리하므로
    Controller의 일반적인 예외 처리와 별도로 동작한다.
*/
@Component
public class AuthenticationEntryPointImpl implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public AuthenticationEntryPointImpl(ObjectMapper objectMapper) {
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
