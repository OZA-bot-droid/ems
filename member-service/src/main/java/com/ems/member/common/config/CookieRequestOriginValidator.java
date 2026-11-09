package com.ems.member.common.config;

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

    public CookieRequestOriginValidator(@Value("${password-reset.frontend-url}") String frontendUrl,
                                        @Value("${app.cookie-secure}") String gatewayUrl) {
        this.allowedOrigins = Set.of(
                toOrigin(frontendUrl),
                toOrigin(gatewayUrl)
        );
    }

    private String toOrigin(String url) {
        URI uri = URI.create(url);

        String origin = uri.getScheme() + "://" + uri.getHost();

        if (uri.getPort() != -1) {
            origin += ":" + uri.getPort();
        }

        return origin;
    }

    public void validate(HttpServletRequest request) {
        String origin = request.getHeader("Origin");

        if (origin == null || !allowedOrigins.contains(origin)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "허용되지 않은 요청 출처입니다.");
        }
    }
}
