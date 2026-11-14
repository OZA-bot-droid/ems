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
@Component
public class InternalMemberServiceAuthFilter extends OncePerRequestFilter {
    private final byte[] secret;

    public InternalMemberServiceAuthFilter(@Value("${EMS_INTERNAL_TOKEN}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("EMS_INTERNAL_TOKEN must have at least 32 characters");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/members/internal/");
    }

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
