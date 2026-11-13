package com.ems.member.common.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private final String frontendUrl;

    public OAuth2LoginFailureHandler(@Value("${password-reset.frontend-url}") String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {

        // OAuth 로그인 과정에서 사용한 임시 정보 정리
        HttpSession session = request.getSession(false);

        if (session != null) {
            session.removeAttribute("role");
            session.removeAttribute("clientId");
        }

        // 내부 예외 메시지는 사용자에게 직접 노출하지 않음
        response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
    }
}
