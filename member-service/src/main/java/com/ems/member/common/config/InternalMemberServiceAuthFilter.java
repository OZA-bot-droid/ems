package com.ems.member.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** 회원 내부 API에 서비스 간 인증을 적용합니다. */
/*
    내부 서비스 전용 API의 접근을 검증하는 필터

    /members/internal/** 경로에만 적용된다.
    요청 헤더의 X-Internal-Service-Token을 서버 설정값과 비교하여
    일치하는 요청만 통과시킨다.

    일반 사용자의 JWT 인증과는 별도로
    서비스 간 통신을 보호하기 위한 인증 방식이다.
*/
@Component
public class InternalMemberServiceAuthFilter extends OncePerRequestFilter {
    private final byte[] secret;

    public InternalMemberServiceAuthFilter(@Value("${EMS_INTERNAL_TOKEN}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("EMS_INTERNAL_TOKEN must have at least 32 characters");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    /*
        내부 API 경로가 아닌 요청은 이 필터의 검증 대상에서 제외한다.

        false: 필터 실행
        true: 필터 건너뜀
    */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/members/internal/");
    }

    /*
        내부 서비스 인증 토큰을 검증한다.

        토큰이 없거나 설정된 비밀값과 다르면 403을 반환한다.
        정상적인 요청은 다음 필터로 전달한다.

        MessageDigest.isEqual()을 이용해 바이트 배열을 비교한다.
    */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        String supplied = request.getHeader("X-Internal-Service-Token");
        if (supplied == null || !MessageDigest.isEqual(secret, supplied.getBytes(StandardCharsets.UTF_8))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid service credential");
            return;
        }
        chain.doFilter(request, response);
    }
}
