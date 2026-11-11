package com.ems.member.common.config;

import com.ems.member.common.exception.InvalidRequestOriginException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.Set;

@Component
public class CookieRequestOriginValidator {

    private final Set<String> allowedOrigins;

    public CookieRequestOriginValidator(@Value("${password-reset.frontend-url}") String frontendUrl) {
        this.allowedOrigins = Set.of(
                toOrigin(frontendUrl)
        );
    }

    private String toOrigin(String url) {
        URI uri = URI.create(url);

        if(uri.getScheme() == null
                || uri.getHost() == null
                || !Set.of("http", "https").contains(uri.getScheme())) {
            throw new IllegalArgumentException("올바르지 않은 Frontend URL 설정입니다.");
        }

        String origin = uri.getScheme() + "://" + uri.getHost();

        if (uri.getPort() != -1) {
            origin += ":" + uri.getPort();
        }

        return origin;
    }

    public void validate(HttpServletRequest request) {
        String origin = request.getHeader("Origin");

        if (origin == null || !allowedOrigins.contains(origin)) {
            throw new InvalidRequestOriginException();
        }
    }
}
