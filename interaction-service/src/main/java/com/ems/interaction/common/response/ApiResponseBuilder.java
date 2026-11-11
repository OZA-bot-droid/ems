package com.ems.interaction.common.response;


import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.net.URI;

//공통 성공 응답 생성 클래스
@Component
public class ApiResponseBuilder {

    public <T> ResponseEntity<ApiSuccessResponse<T>> ok(T data, String message, HttpServletRequest request) {
        return build(data, message, HttpStatus.OK, request);
    }

    // location 없는  created() 메서드
    public <T> ResponseEntity<ApiSuccessResponse<T>> created(T data, String message, HttpServletRequest request) {
        return build(data, message, HttpStatus.CREATED, request);
    }

    // Location 헤더를 추가하는 created() 메서드
    public <T> ResponseEntity<ApiSuccessResponse<T>> created(T data, String message, String resourcePath, HttpServletRequest request) {
        String path = ApiPathUtils.externalPath(request);
        String traceId = traceId();

        ApiSuccessResponse<T> body = ApiSuccessResponse.of(data, message, HttpStatus.CREATED.value(), path, traceId);

        return ResponseEntity.created(URI.create(resourcePath)).body(body);
    }


    private <T> ResponseEntity<ApiSuccessResponse<T>> build(T data, String message, HttpStatus status, HttpServletRequest request) {
        String path = ApiPathUtils.externalPath(request);

        String traceId = MDC.get("traceId");

        if (traceId == null || traceId.isBlank()) {
            traceId = MDC.get("trace_id");
        }

        if (traceId != null && traceId.isBlank()) {
            traceId = null;
        }

        ApiSuccessResponse<T> body = ApiSuccessResponse.of(data, message, status.value(), path, traceId);

        return ResponseEntity.status(status).body(body);
    }


    private String traceId() {
        String id = MDC.get("traceId");

        if (id == null || id.isBlank()) {
            id = MDC.get("trace_id");
        }

        return id == null || id.isBlank() ? null : id;
    }
}
