package com.ems.gateway.error;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebExceptionHandler;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.util.concurrent.TimeoutException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GatewayExceptionHandler implements WebExceptionHandler {
    private final GatewayErrorWriter writer;

    public GatewayExceptionHandler(GatewayErrorWriter writer) {
        this.writer = writer;
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable error) {
        if (exchange.getResponse().isCommitted()) return Mono.error(error);
        if (hasCause(error, TimeoutException.class)
                || hasCause(error, SocketTimeoutException.class)) {
            return writer.write(exchange, HttpStatus.GATEWAY_TIMEOUT,
                    "UPSTREAM_TIMEOUT", "연결된 서비스의 응답 시간이 초과되었습니다.");
        }
        if (hasCause(error, ConnectException.class)) {
            return writer.write(exchange, HttpStatus.SERVICE_UNAVAILABLE,
                    "SERVICE_UNAVAILABLE", "연결된 서비스를 이용할 수 없습니다.");
        }
        if (error instanceof ResponseStatusException rse) {
            if (rse.getStatusCode().value() == 504) {
                return writer.write(exchange, HttpStatus.GATEWAY_TIMEOUT,
                        "UPSTREAM_TIMEOUT", "연결된 서비스의 응답 시간이 초과되었습니다.");
            }
            if (rse.getStatusCode().value() == 503) {
                return writer.write(exchange, HttpStatus.SERVICE_UNAVAILABLE,
                        "SERVICE_UNAVAILABLE", "연결된 서비스를 이용할 수 없습니다.");
            }
            // Do not convert unrelated statuses into upstream failures.
            return Mono.error(error);
        }
        return Mono.error(error); // Existing Spring Boot fallback remains responsible.
    }

    private boolean hasCause(Throwable error, Class<? extends Throwable> type) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (type.isInstance(cause)) return true;
        }
        return false;
    }
}
