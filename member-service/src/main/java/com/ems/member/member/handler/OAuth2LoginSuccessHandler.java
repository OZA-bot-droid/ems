package com.ems.member.member.handler;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.SocialLoginDTO;
import com.ems.member.member.service.AuthService;
import com.ems.member.member.service.JwtTokenService;
import com.ems.member.member.service.SocialLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    // AuthenticationSuccessHandler : 인증 성공 직후 실행되는 후처리 담당 인터페이스
    // Google 소셜 로그인 성공
    // => Spring Security가 Authentication 생성
    // => 해당 인터페이스의 구현 메서드 실행
    // => 회원 가입 혹은 로그인 처리
    // => 로그인 처리시 token 발급
    // => 응답 처리

    private final SocialLoginService socialLoginService;
    private final JwtTokenService jwtTokenService;
    private final AuthService authService;

    public OAuth2LoginSuccessHandler(SocialLoginService socialLoginService, JwtTokenService jwtTokenService, AuthService authService) {
        this.socialLoginService = socialLoginService;
        this.jwtTokenService = jwtTokenService;
        this.authService = authService;
    }

    // 인증이 성공했을 때 Spring Security가 자동으로 호출
    // HttpServletRequest : 로그인 요청 정보를 가지고 있음
    // HttpServletResponse : 인증 성공 후 클라이언트에게 응답시 사용
    // Authentication : 인증된 사용자 정보
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // OAuth2 로그인 성공 후, 로그인한 사용자 정보와 권한, 어떤 소셜 로그인인지에 대한 정보를 담고 있는 Spring Security의 인증 객체
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;

        // Google 같은 OpenID Connect 로그인에서 인증된 사용자의 email, name, sub, ID Token, Claim 등을 담고 있는 Spring Security의 사용자 정보 객체
        OidcUser oidcUser = (OidcUser) oauthToken.getPrincipal();

        // 어떤 OAuth Provider인지 확인하는 메서드
        String provider = oauthToken.getAuthorizedClientRegistrationId();
        String providerId = oidcUser.getSubject();  // google 사용자 고유 id
        String email = oidcUser.getEmail();         // gmail
        String name = oidcUser.getFullName();       // 이름

        // 서버가 사용자별 상태 데이터를 저장하는 객체
        // OAuth2 인증 절차에서 임시 상태 저장 용도로 사용
        // JSESSIONID(session 식별자)를 서버가 보고 해당 HttpSession을 찾음
        HttpSession session = request.getSession();
        SocialLoginDTO socialUser = new SocialLoginDTO(provider, providerId, email, name);
        Role role = (Role) session.getAttribute("role");



        try {
            if (role != null) {
                socialLoginService.register(socialUser, role);

                // 현재 세션에 저장해 둔 특정 속성 하나를 삭제하는 메서드
                session.removeAttribute("role");

                // 클라이언트에게 다른 URL로 다시 이동하라고 응답하는 메서드
                response.sendRedirect("http://127.0.0.1:5173/");
            } else {

                Member member = socialLoginService.login(socialUser);

                // NullPointerException 주의
                // 현재 요청과 관련된 HttpSession을 가져옴
                Object clientId = request.getSession()
                        // clientId라는 이름으로 저장해둔 값을 가져옴
                        .getAttribute("clientId");

                if (clientId == null) {
                    throw new IllegalStateException("null 발생");
                }

                String accessToken = jwtTokenService.createAccessToken(member.getId(), role);
                String refreshToken = jwtTokenService.createRefreshToken(member.getId(), role);

                String loginCode = socialLoginService.save(accessToken, refreshToken);
                authService.changeRefreshToken(
                        member.getId(),
                        refreshToken,
                        clientId.toString(),
                        loginCode
                );

                // Access Token/Refresh Token 자체를 URL에 직접 넣지 않고, 짧게 유효한 일회성 코드만 프론트에 넘긴 다음 그 코드로 서버에서 토큰을 교환하는 구조를 만들기 위함
                response.sendRedirect("http://127.0.0.1:5173/oauth-success?code=" + loginCode);
            }
        } catch (IllegalArgumentException e) {

            String message = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);

            if(role != null) {
                session.removeAttribute("role");

                response.sendRedirect("http://127.0.0.1:5173/signup?error=" + message);
            } else {
                response.sendRedirect("http://127.0.0.1:5173/login?error=" + message);
            }
        }
    }
}
