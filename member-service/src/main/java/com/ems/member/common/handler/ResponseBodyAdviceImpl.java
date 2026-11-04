package com.ems.member.common.handler;

import com.ems.member.common.dto.APIErrorResponse;
import com.ems.member.common.dto.APISuccessResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.time.Instant;

@RestControllerAdvice
public class ResponseBodyAdviceImpl implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        return !returnType.getParameterType().equals(void.class);
    }

    @Nullable
    @Override
    public Object beforeBodyWrite(@Nullable Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {
        if (body instanceof APIErrorResponse || body instanceof APISuccessResponse<?>) {
            return body;
        }

        int status = 200;
        if(response instanceof ServletServerHttpResponse servletResponse) {
            status = servletResponse.getServletResponse()
                    .getStatus();
        }

        return new APISuccessResponse<>(
                true,
                body,
                "요청 성공",
                status,
                Instant.now(),
                request.getURI().getPath(),
                null
        );
    }
}
