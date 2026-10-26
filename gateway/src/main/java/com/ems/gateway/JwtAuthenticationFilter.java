package com.ems.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtAuthenticationFilter implements GlobalFilter {

    private final JwtDecoder jwtDecoder;
    private static final List<String> PASS_PATHS = List.of(
            "/members/register",
            "/members/login",
            "/members/logout",
            "/members/refresh",

            "/members/google",
            "/members/oauth2/exchange"
    );

    public JwtAuthenticationFilter(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // jwt 검사를 필요로 하지 않는 경로는 filter 제외
        String path = exchange.getRequest()
                .getURI()
                .getPath();
        System.out.println(path);
        if(PASS_PATHS.contains(path) || path.startsWith("/login/oauth2/") || path.startsWith("/oauth2/")) {
            return chain.filter(exchange);
        }

        // Bearer Token 가져오기
        String authorization = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if(authorization == null || !authorization.startsWith("Bearer ")) {

            exchange.getResponse()
                    .setStatusCode(HttpStatus.UNAUTHORIZED);

            return exchange.getResponse().setComplete();
        }

        Jwt jwt = jwtDecoder.decode(authorization.substring(7));

        try {
            if(!"access".equals(jwt.getClaimAsString("token_type"))) {

                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);

                return exchange.getResponse().setComplete();
            }

        } catch (JwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);

            return exchange.getResponse().setComplete();
        }

        ServerHttpRequest request = exchange.getRequest()
                .mutate()
                .header("X-Member-Id", jwt.getSubject())
                .build();

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(request)
                .build();

        return chain.filter(mutatedExchange);
    }
}
