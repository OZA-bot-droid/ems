package com.ems.event.common.config;

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

/** Checks a dedicated credential on all internal Event APIs. */
@Component
public class InternalServiceAuthFilter extends OncePerRequestFilter {
    private final byte[] secret;
    public InternalServiceAuthFilter(@Value("${ems.internal-token}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("EMS_INTERNAL_TOKEN must have at least 32 characters");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/internal/");
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        String header = request.getHeader("X-Internal-Service-Token");
        if (header == null || !MessageDigest.isEqual(secret, header.getBytes(StandardCharsets.UTF_8))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid service credential");
            return;
        }
        chain.doFilter(request, response);
    }
}
