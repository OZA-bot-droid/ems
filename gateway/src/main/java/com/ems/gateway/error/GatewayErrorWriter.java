package com.ems.gateway.error;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
public class GatewayErrorWriter {
    private final ObjectMapper objectMapper;

    public GatewayErrorWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Mono<Void> write(ServerWebExchange exchange, HttpStatusCode status,
                            String code, String message) {
        var response = exchange.getResponse();
        if (response.isCommitted()) return Mono.error(
                new IllegalStateException("Response already committed"));

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String path = exchange.getRequest().getPath().value();
        // No trace id is invented. Distributed tracing can supply one later.
        ApiErrorResponse body = new ApiErrorResponse(false, code, message,
                status.value(), Instant.now(), path, null);
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(body);
            return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
        } catch (JsonProcessingException ex) {
            return Mono.error(ex);
        }
    }
}
