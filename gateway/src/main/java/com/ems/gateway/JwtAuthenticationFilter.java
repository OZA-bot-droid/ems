package com.ems.gateway;

import java.util.Set;

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

@Component
public class JwtAuthenticationFilter
        implements GlobalFilter, Ordered {

    private static final String MEMBER_ID = "X-Member-Id";
    private static final String USER_ROLE = "X-User-Role";
    private static final String LEGACY_USER_ID = "X-User-Id";

    private static final Set<String> ROLES =
            Set.of("USER", "ADMIN");

    private final JwtDecoder jwtDecoder;

    public JwtAuthenticationFilter(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public int getOrder() {
        // 라우팅 및 StripPrefix 처리보다 먼저 적용
        return -100;
    }

    @Override
    public Mono<Void> filter(
            ServerWebExchange exchange,
            GatewayFilterChain chain) {

        String path = exchange.getRequest()
                .getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        // 클라이언트가 제출한 내부 인증 헤더는
        // 공개 API 요청에서도 제거한다.
        ServerHttpRequest cleanRequest =
                exchange.getRequest().mutate()
                        .headers(headers -> {
                            headers.remove(MEMBER_ID);
                            headers.remove(USER_ROLE);
                            headers.remove(LEGACY_USER_ID);
                        })
                        .build();

        ServerWebExchange cleanExchange =
                exchange.mutate()
                        .request(cleanRequest)
                        .build();

        // CORS Preflight는 인증하지 않음.
        // 실제 CORS 허용 여부는 SecurityConfig에서 결정.
        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(cleanExchange);
        }

        // 로그인, 회원가입, 재발급 등
        if (isPublicPath(path, method)) {
            return chain.filter(cleanExchange);
        }

        String authorization = cleanRequest
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (authorization == null ||
                !authorization.startsWith("Bearer ")) {
            return unauthorized(cleanExchange);
        }

        try {
            String token = authorization.substring(7).trim();

            if (token.isBlank()) {
                return unauthorized(cleanExchange);
            }

            Jwt jwt = jwtDecoder.decode(token);

            if (!"access".equals(
                    jwt.getClaimAsString("token_type"))) {
                return unauthorized(cleanExchange);
            }

            String subject = jwt.getSubject();
            String role = jwt.getClaimAsString("role");

            if (subject == null || role == null ||
                    !ROLES.contains(role)) {
                return unauthorized(cleanExchange);
            }

            // 회원 ID가 BIGINT의 양수 범위인지 확인
            long memberId = Long.parseLong(subject);
            if (memberId <= 0) {
                return unauthorized(cleanExchange);
            }

            ServerHttpRequest authenticatedRequest =
                    cleanRequest.mutate()
                            .headers(headers -> {
                                headers.set(
                                        MEMBER_ID,
                                        String.valueOf(memberId)
                                );
                                headers.set(USER_ROLE, role);
                            })
                            .build();

            return chain.filter(
                    cleanExchange.mutate()
                            .request(authenticatedRequest)
                            .build()
            );

        } catch (JwtException |
                 NumberFormatException exception) {
            return unauthorized(cleanExchange);
        }
    }

    private boolean isPublicPath(
            String path, HttpMethod method) {

        if (HttpMethod.POST.equals(method)) {
            return path.equals("/api/members/register")
                    || path.equals("/api/members/login")
                    || path.equals("/api/members/reissue")
                    || path.equals("/api/members/oauth2/exchange");
        }

        if (HttpMethod.DELETE.equals(method)) {
            return path.equals("/api/members/logout");
        }

        if (HttpMethod.GET.equals(method)) {
            return path.equals("/api/members/google")
                    || path.startsWith(
                    "/api/oauth2/authorization/")
                    || path.startsWith(
                    "/api/login/oauth2/code/");
        }

        return false;
    }

    private Mono<Void> unauthorized(
            ServerWebExchange exchange) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);

        return exchange.getResponse().setComplete();
    }
}
