package com.ems.member.common.handler;

import com.ems.member.common.domain.SuccessCode;
import com.ems.member.common.dto.APIErrorResponse;
import com.ems.member.common.dto.APISuccessResponse;
import com.ems.member.member.dto.MessageResponseDTO;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalSuccessHandler implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        return !returnType.getParameterType().equals(void.class)
                && !StringHttpMessageConverter.class.isAssignableFrom(converterType);
    }

    @Nullable
    @Override
    public Object beforeBodyWrite(@Nullable Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {

        // 이미 공통 응답 객체이면 다시 감싸지 않음
        if (body instanceof APIErrorResponse || body instanceof APISuccessResponse<?>) {
            return body;
        }

        int status = 200;
        if(response instanceof ServletServerHttpResponse servletResponse) {
            status = servletResponse.getServletResponse()
                    .getStatus();
        }

        // 오류, 본문이 없는 응답은 처리하지 않음
        if (status < 200
                || status >= 300
                || status == 204
                || status == 205
                || body == null) {
            return body;
        }

        // 기본 성공 메시지
        SuccessCode successCode = SuccessCode.REQUEST_SUCCESS;
        Object data = body;

        // Controller에서 전달한 SuccessCode 확인
        if (body instanceof MessageResponseDTO<?>(Object res, SuccessCode code)) {
            data = res;
            successCode = code;
        }

        return new APISuccessResponse<>(
                true,
                data,
                successCode.getMessage(),
                status,
                Instant.now(),
                request.getURI().getPath(),
                null
        );
    }
}
