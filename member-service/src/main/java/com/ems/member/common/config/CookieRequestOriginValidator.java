package com.ems.member.common.config;

import com.ems.member.common.exception.InvalidRequestOriginException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Set;

// CSRF 공격을 완화하기 위한 클래스
@Component
public class CookieRequestOriginValidator {

    // 중복되지 않는 문자열 집합을 저장하는 컬렉션
    private final Set<String> allowedOrigins;

    public CookieRequestOriginValidator(@Value("${password-reset.frontend-url}") String frontendUrl) {

        // 허용된 웹사이트의 출처를 저장
        this.allowedOrigins = Set.of(
                toOrigin(frontendUrl)
        );
    }

    private String toOrigin(String url) {
        URI uri = URI.create(url);
        String scheme = uri.getScheme();
        String host = uri.getHost();

        if(scheme == null
                || host == null
                || !Set.of("http", "https").contains(scheme)
                || uri.getUserInfo() != null) {
            throw new IllegalArgumentException("올바르지 않은 Frontend URL 설정입니다.");
        }

        String origin = scheme + "://" + host;

        if (uri.getPort() != -1) {
            origin += ":" + uri.getPort();
        }

        return origin;
    }

    public void validate(HttpServletRequest request) {
        String origin = request.getHeader("Origin");

        // 허용된 origin과 정확히 일치하지 않으면 요청을 차단하는 구조
        if (origin == null || !allowedOrigins.contains(origin)) {
            throw new InvalidRequestOriginException();
        }
    }
}
