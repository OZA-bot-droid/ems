package com.ems.gateway.error;

import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.concurrent.TimeoutException;

@Component
@Order(-2)
public class GatewayExceptionHandler
        implements ErrorWebExceptionHandler {

    private final GatewayErrorWriter writer;

    public GatewayExceptionHandler(
            GatewayErrorWriter writer
    ) {
        this.writer = writer;
    }

    @Override
    public Mono<Void> handle(
            ServerWebExchange exchange,
            Throwable error
    ) {

        // 이미 응답을 전송했다면 다시 작성하지 않음
        if (exchange.getResponse().isCommitted()) {
            return Mono.error(error);
        }

        String path = exchange.getRequest()
                .getPath()
                .value();

        // REST API만 표준 JSON 처리
        // Actuator, WebSocket, 정적 파일 등의 동작 보존
        if (!path.equals("/api")
                && !path.startsWith("/api/")) {
            return Mono.error(error);
        }

        // 1. 연결된 서비스의 응답 시간 초과
        if (hasCause(error, TimeoutException.class)
                || hasCause(error, SocketTimeoutException.class)) {

            return writer.write(
                    exchange,
                    HttpStatus.GATEWAY_TIMEOUT,
                    GatewayErrorCode.UPSTREAM_TIMEOUT,
                    "연결된 서비스의 응답 시간이 초과되었습니다."
            );
        }

        // 2. 서비스 연결 실패
        if (hasCause(error, ConnectException.class)
                || hasCause(error, UnknownHostException.class)) {

            return writer.write(
                    exchange,
                    HttpStatus.SERVICE_UNAVAILABLE,
                    GatewayErrorCode.SERVICE_UNAVAILABLE,
                    "연결된 서비스를 이용할 수 없습니다."
            );
        }

        // 3. HTTP 상태가 지정된 예외
        ResponseStatusException statusException =
                findCause(error, ResponseStatusException.class);

        if (statusException != null) {
            HttpStatusCode status = statusException.getStatusCode();

            // 이 핸들러는 오류만 처리
            if (status.value() < 400) {
                return Mono.error(error);
            }

            GatewayErrorCode code =
                    resolveCode(status.value());

            String message =
                    resolveMessage(status.value());

            // 405 등의 표준 헤더 보존
            exchange.getResponse()
                    .getHeaders()
                    .addAll(statusException.getHeaders());

            return writer.write(
                    exchange,
                    status,
                    code,
                    message
            );
        }

        // 4. 분류되지 않은 Gateway 내부 오류
        return writer.write(
                exchange,
                HttpStatus.INTERNAL_SERVER_ERROR,
                GatewayErrorCode.INTERNAL_SERVER_ERROR,
                "서버 내부 오류가 발생했습니다."
        );
    }

    private GatewayErrorCode resolveCode(int status) {
        return switch (status) {
            case 400 -> GatewayErrorCode.VALIDATION_ERROR;
            case 401 -> GatewayErrorCode.UNAUTHORIZED;
            case 403 -> GatewayErrorCode.FORBIDDEN;
            case 404 -> GatewayErrorCode.NOT_FOUND;
            case 405 -> GatewayErrorCode.METHOD_NOT_ALLOWED;
            case 409 -> GatewayErrorCode.CONFLICT;
            case 413 -> GatewayErrorCode.PAYLOAD_TOO_LARGE;
            case 415 -> GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE;
            case 429 -> GatewayErrorCode.TOO_MANY_REQUESTS;
            case 502 -> GatewayErrorCode.UPSTREAM_SERVICE_ERROR;
            case 503 -> GatewayErrorCode.SERVICE_UNAVAILABLE;
            case 504 -> GatewayErrorCode.UPSTREAM_TIMEOUT;

            default -> {
                if (status >= 400 && status < 500) {
                    yield GatewayErrorCode.INVALID_REQUEST;
                }
                yield GatewayErrorCode.INTERNAL_SERVER_ERROR;
            }
        };
    }

    private String resolveMessage(int status) {
        return switch (status) {
            case 400 -> "요청 형식이 올바르지 않습니다.";
            case 401 -> "인증이 필요합니다.";
            case 403 -> "접근 권한이 없습니다.";
            case 404 -> "요청한 API를 찾을 수 없습니다.";
            case 405 -> "허용되지 않은 HTTP 메서드입니다.";
            case 409 -> "요청이 현재 상태와 충돌합니다.";
            case 413 -> "요청 데이터가 너무 큽니다.";
            case 415 -> "지원하지 않는 콘텐츠 형식입니다.";
            case 429 -> "요청 횟수가 제한을 초과했습니다.";
            case 502 -> "연결된 서비스에서 오류가 발생했습니다.";
            case 503 -> "연결된 서비스를 이용할 수 없습니다.";
            case 504 -> "연결된 서비스의 응답 시간이 초과되었습니다.";

            default -> {
                if (status >= 400 && status < 500) {
                    yield "요청을 처리할 수 없습니다.";
                }
                yield "서버 내부 오류가 발생했습니다.";
            }
        };
    }

    private boolean hasCause(
            Throwable error,
            Class<? extends Throwable> type
    ) {
        return findCause(error, type) != null;
    }

    private <T extends Throwable> T findCause(
            Throwable error,
            Class<T> type
    ) {
        Throwable current = error;

        // 비정상적인 순환 원인 체인 방지
        for (int depth = 0;
             current != null && depth < 16;
             depth++) {

            if (type.isInstance(current)) {
                return type.cast(current);
            }

            current = current.getCause();
        }

        return null;
    }
}