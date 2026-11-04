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
    private static final Set<String> ROLES = Set.of("USER", "ADMIN");
    private final JwtDecoder jwtDecoder;
    private final GatewayErrorWriter errors;

    public JwtAuthenticationFilter(JwtDecoder jwtDecoder, GatewayErrorWriter errors) {
        this.jwtDecoder = jwtDecoder;
        this.errors = errors;
    }

    @Override public int getOrder() { return -100; }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();
        ServerHttpRequest cleanRequest = exchange.getRequest().mutate().headers(h -> {
            h.remove("X-Member-Id");
            h.remove("X-User-Role");
            h.remove("X-User-Id");
        }).build();
        ServerWebExchange cleaned = exchange.mutate().request(cleanRequest).build();

        if (HttpMethod.OPTIONS.equals(method) || isPublicPath(path, method)) {
            return chain.filter(cleaned);
        }

        String authorization = cleanRequest.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return errors.write(cleaned, HttpStatus.UNAUTHORIZED, GatewayErrorCode.UNAUTHORIZED, "인증 토큰이 필요합니다.");
        }
        try {
            String token = authorization.substring(7).trim();
            if (token.isEmpty()) return invalid(cleaned);
            Jwt jwt = jwtDecoder.decode(token);
            if (!"access".equals(jwt.getClaimAsString("token_type"))) return invalid(cleaned);
            String subject = jwt.getSubject();
            String role = jwt.getClaimAsString("role");
            if (subject == null || role == null || !ROLES.contains(role)) return invalid(cleaned);
            long memberId = Long.parseLong(subject);
            if (memberId <= 0) return invalid(cleaned);
            ServerHttpRequest authenticated = cleanRequest.mutate().headers(h -> {
                h.set("X-Member-Id", Long.toString(memberId));
                h.set("X-User-Role", role);
            }).build();
            return chain.filter(cleaned.mutate().request(authenticated).build());
        } catch (JwtException | NumberFormatException ex) {
            return invalid(cleaned);
        }
    }

    private Mono<Void> invalid(ServerWebExchange exchange) {
        return errors.write(exchange, HttpStatus.UNAUTHORIZED, GatewayErrorCode.INVALID_TOKEN, "유효하지 않은 인증 토큰입니다.");
    }

    private boolean isPublicPath(String path, HttpMethod method) {
        if (HttpMethod.POST.equals(method)) {
            return path.equals("/api/members/register")
                    || path.equals("/api/members/login")
                    || path.equals("/api/members/reissue")
                    || path.equals("/api/members/oauth2/exchange");
        }
        if (HttpMethod.DELETE.equals(method)) return path.equals("/api/members/logout");
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
