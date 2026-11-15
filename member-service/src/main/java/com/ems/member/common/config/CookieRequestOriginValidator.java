package com.ems.member.common.config;

import com.ems.member.common.exception.InvalidRequestOriginException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Set;

/*
    CSRF 공격을 완화하기 위한 클래스
    쿠키 기반 인증 요청의 Origin을 검증하는 클래스

    허용된 프론트엔드 주소에서 발생한 요청인지 확인하여
    다른 출처에서 보내는 요청을 차단한다.

    Refresh Token을 사용하는 재발급 및 로그아웃 요청에서
    CSRF 위험을 줄이기 위한 추가 검증으로 사용한다.
*/
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

    /*
        프론트엔드 URL에서 Origin을 추출

        Origin은 프로토콜, 호스트, 포트로 구성되며, 경로나 쿼리 문자열은 포함하지 않는다.
        잘못된 URL 설정이면 예외를 발생시킨다.
    */
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

    /*
        요청의 Origin 헤더를 허용된 출처와 비교

        Origin이 없거나 허용 목록과 일치하지 않으면 요청을 거부

        이를 통해 CSRF 공격 위험을 완화할 수 있지만,
        Origin 검증만으로 모든 CSRF 공격을 방지할 수는 없다는 한계가 있다.
    */
    public void validate(HttpServletRequest request) {
        String origin = request.getHeader("Origin");

        // 허용된 origin과 정확히 일치하지 않으면 요청을 차단하는 구조
        if (origin == null || !allowedOrigins.contains(origin)) {
            throw new InvalidRequestOriginException();
        }
    }
}
