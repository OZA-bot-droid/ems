
package com.ems.gateway.auth;

import com.ems.gateway.error.GatewayErrorWriter;
import com.ems.gateway.error.GatewayErrorCode;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

import java.util.Set;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Set<String> ROLES =
            Set.of("USER", "ADMIN");

    // WebSocket Handshake 경로
    private static final String WEBSOCKET_PATH =
            "/api/ws/interactions";

    private final JwtDecoder jwtDecoder;
    private final GatewayErrorWriter errors;

    public JwtAuthenticationFilter(
            JwtDecoder jwtDecoder,
            GatewayErrorWriter errors
    ) {
        this.jwtDecoder = jwtDecoder;
        this.errors = errors;
    }

    @Override
    public int getOrder() {
        return -100;
    }

    @Override
    public Mono<Void> filter(
            ServerWebExchange exchange,
            GatewayFilterChain chain
    ) {

        String path =
                exchange.getRequest().getURI().getPath();

        HttpMethod method =
                exchange.getRequest().getMethod();

        // 클라이언트가 위조한 인증 헤더 제거
        ServerHttpRequest cleanRequest =
                exchange.getRequest()
                        .mutate()
                        .headers(headers -> {
                            headers.remove("X-Member-Id");
                            headers.remove("X-User-Role");
                            headers.remove("X-User-Id");
                        })
                        .build();

        ServerWebExchange cleaned =
                exchange.mutate()
                        .request(cleanRequest)
                        .build();

        // CORS Preflight 요청
        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(cleaned);
        }

        // WebSocket Handshake 처리 (신규)
        // 실제 사용자 인증은 Interaction의
        // STOMP CONNECT 단계에서 수행
        if (isWebSocketHandshake(cleanRequest, path, method)) {
            return chain.filter(cleaned);
        }

        // 기존 공개 API
        if (isPublicPath(path, method)) {
            return chain.filter(cleaned);
        }

        // HTTP API Access Token 확인
        String authorization =
                cleanRequest.getHeaders()
                        .getFirst(HttpHeaders.AUTHORIZATION);

        if (authorization == null ||
                !authorization.startsWith("Bearer ")) {

            return errors.write(
                    cleaned,
                    HttpStatus.UNAUTHORIZED,
                    GatewayErrorCode.UNAUTHORIZED,
                    "인증 토큰이 필요합니다."
            );
        }

        try {
            String token =
                    authorization.substring(7).trim();

            if (token.isEmpty()) {
                return invalid(cleaned);
            }

            // RSA 공개키로 JWT 검증
            Jwt jwt = jwtDecoder.decode(token);

            // Refresh Token의 API 사용 차단
            if (!"access".equals(
                    jwt.getClaimAsString("token_type"))) {
                return invalid(cleaned);
            }

            // JWT Claim 추출
            String subject = jwt.getSubject();
            String role = jwt.getClaimAsString("role");

            if (subject == null ||
                    role == null ||
                    !ROLES.contains(role)) {
                return invalid(cleaned);
            }

            long memberId = Long.parseLong(subject);

            if (memberId <= 0) {
                return invalid(cleaned);
            }

            // 검증된 사용자 정보로 인증 헤더 생성
            ServerHttpRequest authenticated =
                    cleanRequest.mutate()
                            .headers(headers -> {
                                headers.set(
                                        "X-Member-Id",
                                        Long.toString(memberId)
                                );
                                headers.set(
                                        "X-User-Role",
                                        role
                                );
                            })
                            .build();

            return chain.filter(
                    cleaned.mutate()
                            .request(authenticated)
                            .build()
            );

        } catch (JwtException | NumberFormatException ex) {
            return invalid(cleaned);
        }
    }

    // WebSocket Handshake 판단 (신규)
    private boolean isWebSocketHandshake(
            ServerHttpRequest request,
            String path,
            HttpMethod method
    ) {
        if (!HttpMethod.GET.equals(method) ||
                !WEBSOCKET_PATH.equals(path)) {
            return false;
        }

        String upgrade =
                request.getHeaders().getUpgrade();

        return "websocket".equalsIgnoreCase(upgrade);
    }

    private Mono<Void> invalid(
            ServerWebExchange exchange
    ) {
        return errors.write(
                exchange,
                HttpStatus.UNAUTHORIZED,
                GatewayErrorCode.INVALID_TOKEN,
                "유효하지 않은 인증 토큰입니다."
        );
    }

    // 기존 공개 API 정책 유지
    private boolean isPublicPath(
            String path,
            HttpMethod method
    ) {

        if (HttpMethod.POST.equals(method)) {
            return path.equals("/api/members/register")
                    || path.equals("/api/members/login")
                    || path.equals("/api/members/reissue")
                    || path.equals("/api/members/oauth2/exchange")
                    || path.equals("/api/members/password/reset-request")
                    || path.equals("/api/members/password/reset");
        }

        if (HttpMethod.DELETE.equals(method)) {
            return path.equals("/api/members/logout");
        }

        if (HttpMethod.GET.equals(method)) {
            return path.equals("/api/members/google")
                    || path.equals("/api/members/naver")
                    || path.startsWith("/api/oauth2/authorization/")
                    || path.startsWith("/api/login/oauth2/code/")
                    || path.equals("/api/events")
                    || path.equals("/api/events/ping")
                    || path.matches("/api/events/[0-9]+")
                    || path.matches("/api/events/[0-9]+/sessions");
        }

        return false;
    }
}
