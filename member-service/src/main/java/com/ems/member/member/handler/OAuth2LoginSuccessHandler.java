package com.ems.member.member.handler;

import com.ems.member.member.domain.Member;
import com.ems.member.member.dto.SocialLoginDTO;
import com.ems.member.member.service.AuthService;
import com.ems.member.member.service.JwtTokenService;
import com.ems.member.member.service.SocialLoginService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final SocialLoginService socialLoginService;
    private final JwtTokenService jwtTokenService;
    private final AuthService authService;

    public OAuth2LoginSuccessHandler(SocialLoginService socialLoginService, JwtTokenService jwtTokenService, AuthService authService) {
        this.socialLoginService = socialLoginService;
        this.jwtTokenService = jwtTokenService;
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OidcUser oidcUser = (OidcUser) oauthToken.getPrincipal();

        String provider = oauthToken.getAuthorizedClientRegistrationId();   //
        String providerId = oidcUser.getSubject();  // google 사용자 고유 id
        String email = oidcUser.getEmail();         // gmail
        String name = oidcUser.getFullName();       // 이름

        SocialLoginDTO socialUser = new SocialLoginDTO(provider, providerId, email, name);

        Member member = socialLoginService.login(socialUser);

        String clientId = request.getSession()
                .getAttribute("clientId")
                .toString();

        String accessToken = jwtTokenService.createAccessToken(member.getId());
        String refreshToken = jwtTokenService.createRefreshToken(member.getId());

        String loginCode = socialLoginService.save(accessToken, refreshToken);
        authService.changeRefreshToken(
                member.getId(),
                refreshToken,
                clientId,
                loginCode
        );

        response.sendRedirect("http://127.0.0.1:5173/oauth-success?code=" + loginCode);
    }
}
