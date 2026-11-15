package com.ems.member.common.handler;

import com.ems.member.common.exception.InvalidCredentialsException;
import com.ems.member.common.exception.InvalidRequestException;
import com.ems.member.common.exception.MemberEmailDuplicatedException;
import com.ems.member.common.exception.SocialProviderResponseException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.SocialLoginDTO;
import com.ems.member.member.service.AuthService;
import com.ems.member.member.service.JwtTokenService;
import com.ems.member.member.service.SocialLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

/*
    Google 또는 Naver OAuth2 인증 성공 후 실행되는 메서드

    1. 인증 제공자(Google/Naver) 확인
    2. 제공자별 사용자 정보 추출
    3. 세션에 저장된 role을 기준으로 회원가입 또는 로그인 처리
    4. Access Token과 Refresh Token 발급
    5. 일회용 로그인 코드 생성 후 프론트엔드로 리다이렉트

    로그인 처리 후에는 세션에 저장된 임시 role과 clientId를 제거
*/
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
    private final HandlerExceptionResolver handlerExceptionResolver;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(SocialLoginService socialLoginService,
                                     JwtTokenService jwtTokenService,
                                     AuthService authService,
                                     // HandlerExceptionResolver 관련 Resolver들이 여러 개가 있으니 Spring은 이것들을 묶어서 사용하는 대표 Resolver를 handlerExceptionResolver로 등록됨
                                     // handlerExceptionResolver : Spring MVC가 정상적으로 사용하는 전체 예외 처리 체인
                                     @Qualifier("handlerExceptionResolver") HandlerExceptionResolver handlerExceptionResolver,
                                     @Value("${password-reset.frontend-url}") String frontendUrl) {
        this.socialLoginService = socialLoginService;
        this.jwtTokenService = jwtTokenService;
        this.authService = authService;
        this.handlerExceptionResolver = handlerExceptionResolver;
        this.frontendUrl = frontendUrl;
    }

    // 인증이 성공했을 때 Spring Security가 자동으로 호출
    // HttpServletRequest : 로그인 요청 정보를 가지고 있음
    // HttpServletResponse : 인증 성공 후 클라이언트에게 응답시 사용
    // Authentication : 인증된 사용자 정보
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        try {
            // OAuth2 로그인 성공 후, 로그인한 사용자 정보와 권한, 어떤 소셜 로그인인지에 대한 정보를 담고 있는 Spring Security의 인증 객체
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;

            // 어떤 OAuth Provider인지 확인하는 메서드
            String provider = oauthToken.getAuthorizedClientRegistrationId();

            // 현재 요청과 관련된 HttpSession을 가져옴
            HttpSession session = request.getSession();
            Role role = (Role) session.getAttribute("role");
            SocialLoginDTO socialUser = null;

            if("google".equals(provider)) {
                // Google 같은 OpenID Connect 로그인에서 인증된 사용자의 email, name, sub, ID Token, Claim 등을 담고 있는 Spring Security의 사용자 정보 객체
                OidcUser oidcUser = (OidcUser) oauthToken.getPrincipal();

                // 서버가 사용자별 상태 데이터를 저장하는 객체
                // OAuth2 인증 절차에서 임시 상태 저장 용도로 사용
                // JSESSIONID(session 식별자)를 서버가 보고 해당 HttpSession을 찾음
                socialUser = new SocialLoginDTO(
                        provider,
                        oidcUser.getSubject(),  // google 사용자 고유 id
                        oidcUser.getEmail(),    // gmail
                        oidcUser.getFullName()  // 이름
                );
            } else if("naver".equals(provider)) {

                OAuth2User oAuth2User = oauthToken.getPrincipal();
                Map<String, Object> naverResponse = oAuth2User.getAttribute("response");

                if(naverResponse == null) {
                    throw new SocialProviderResponseException("소셜 로그인 사용자 정보를 가져올 수 없습니다.");
                }

                socialUser = new SocialLoginDTO(
                        provider,
                        naverResponse.get("id").toString(),     // naver 사용자 고유 id
                        naverResponse.get("email").toString(),  // naver 계정 이메일
                        naverResponse.get("name").toString()    // 이름
                );

            } else {
                throw new IllegalArgumentException("제공하지 않는 소셜 로그인입니다.");
            }

            if (role != null) {
                // 회원 가입
                Member member = socialLoginService.socialRegister(socialUser, role);
                completeLogin(session, member, response);

            } else {
                // 로그인
                Member member = socialLoginService.socialLogin(socialUser);
                completeLogin(session, member, response);
            }
        } catch (InvalidCredentialsException e) {

            String message = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/login?error=" + message);
        } catch (MemberEmailDuplicatedException e) {

            String message = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/signup?error=" + message);
        } catch(Exception e) {
            handlerExceptionResolver.resolveException(
                    request,
                    response,
                    null,
                    e
            );
        } finally {
            HttpSession session = request.getSession(false);

            if(session != null) {
                // 현재 세션에 저장해 둔 특정 속성 하나를 삭제하는 메서드
                session.removeAttribute("role");
                session.removeAttribute("clientId");
            }
        }
    }

    /*
        소셜 로그인 완료 후 JWT 발급 및 프론트엔드 이동 처리

        세션에 저장된 clientId를 확인하고, Access Token과 Refresh Token을 발급

        Refresh Token은 AuthService를 통해 DB에 저장

        JWT를 URL에 직접 노출하지 않기 위해 일회용 로그인 코드를 발급한 뒤 프론트엔드로 전달

        프론트엔드는 해당 코드를 Token Exchange API에 전달하여 실제 로그인 토큰을 수신
    */
    private void completeLogin(HttpSession session, Member member, HttpServletResponse response) throws IOException {


        // NullPointerException 주의
        // clientId라는 이름으로 저장해둔 값을 가져옴
        Object clientId = session.getAttribute("clientId");

        if (clientId == null) {
            throw new InvalidRequestException("OAuth 로그인에 필요한 clientId가 존재하지 않습니다.");
        }

        String accessToken = jwtTokenService.createAccessToken(member.getId());
        String refreshToken = jwtTokenService.createRefreshToken(member.getId());

        authService.replaceRefreshToken(
                member,
                refreshToken,
                UUID.fromString(clientId.toString())
        );

        // Access Token/Refresh Token 자체를 URL에 직접 넣지 않고, 짧게 유효한 일회성 코드만 프론트에 넘긴 다음 그 코드로 서버에서 토큰을 교환하는 구조를 만들기 위함
        // 클라이언트에게 다른 URL로 다시 이동하라고 응답하는 메서드
        UUID loginCode = socialLoginService.saveLoginCode(accessToken, refreshToken);
        response.sendRedirect(frontendUrl + "/oauth-success?code=" + loginCode);
    }
}
