package com.ems.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

// 그인 실패 횟수 제한과 이메일 발송 제한이 제대로 작동하도록 돕는 클래스
@Component
public class ClientIpHeaderFilter implements GlobalFilter, Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // 현재 구성: Gateway는 Docker 내부 Nginx에서만 요청을 받음
        String ip = exchange.getRequest()
                .getHeaders()
                .getFirst("X-Real_IP");

        if(ip == null || ip.isBlank()) {
            ip = exchange.getRequest().getRemoteAddress() == null
                    ? "unknown"
                    : exchange.getRequest()
                            .getRemoteAddress()
                            .getAddress()
                            .getHostAddress();
        }

        final String clientIp = ip;
        try {
            // 전달값이 IP 주소 형식인지 확인
            if(!isIpLiteral(clientIp)) {
                return reject(exchange);
            }

            // DNS 조회가 필요 없는 숫자형 IP만 사용
            ServerHttpRequest request = exchange.getRequest()
                    .mutate()
                    .headers(headers -> headers.set("X-EMS-Client-IP", clientIp))
                    .build();

            return chain.filter(
                    exchange.mutate()
                            .request(request)
                            .build()
            );
        } catch (Exception e) {
            return reject(exchange);
        }
    }

    private boolean isIpLiteral(String ip) {
        if(ip.matches("(\\d{1,3}\\.){3}\\d{1,3}")) {
            String[] parts = ip.split("\\.");
            for(String part : parts) {
                if(Integer.parseInt(part) > 255) return false;
            }
            return true;
        }

        // IPv6는 검증 전용 라이브러리 또는 별도 파서를 사용해 지원
        return false;
    }

    private Mono<Void> reject(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        return exchange.getResponse()
                .setComplete();
    }

    // JwtAuthenticationFilter보다 먼저 실행
    @Override
    public int getOrder() {
        return -200;
    }
}
