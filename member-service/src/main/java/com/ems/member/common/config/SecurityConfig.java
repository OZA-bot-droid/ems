package com.ems.member.common.config;

import com.ems.member.common.handler.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationFilter;

/*
    Member Service의 Spring Security 설정

    API별 인증 필요 여부와 JWT 기반 인증 방식을 정의한다.
    Google/Naver OAuth2 로그인 처리 및 인증·인가 실패 응답도 설정한다.

    Gateway에서 전달된 요청이라도 Member Service의
    Spring Security 규칙에 따라 추가 검증을 수행한다.
*/
@Configuration
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;
    private final AuthenticationEntryPointImpl authenticationEntryPoint;
    private final AccessDeniedHandlerImpl accessDeniedHandler;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          OAuth2LoginFailureHandler oAuth2LoginFailureHandler,
                          AuthenticationEntryPointImpl authenticationEntryPoint,
                          AccessDeniedHandlerImpl accessDeniedHandler) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.oAuth2LoginFailureHandler = oAuth2LoginFailureHandler;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    /*
        회원 비밀번호 암호화를 위한 PasswordEncoder Bean 등록

        BCrypt를 이용해 비밀번호를 단방향 해시 처리하며, 회원가입, 로그인, 비밀번호 변경 및 재설정에 사용한다.
    */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /*
        JWT의 role claim을 Spring Security 권한으로 변환하는 설정이다.
        변환된 권한은 hasRole("ADMIN") 등의 권한 검사에 사용된다.

        예: role = ADMIN → ROLE_ADMIN
    */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        // jwt 안에 있는 claim을 읽어서 Spring Security의 권한인 GrantedAuthority로 변환하는 클래스
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        // jwt에서 role이라느 이름의 claim을 권한으로 사용 설정
        authoritiesConverter.setAuthoritiesClaimName("role");
        // ROLE_ 접두사 추가
        // hasRole은 내부적으로 ROLE_... 을 찾는 방식
        authoritiesConverter.setAuthorityPrefix("ROLE_");


        // JWT 인증 결과를 Spring Security가 사용하는 Authentication 객체로 변환하는 클래스
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        // authorities = [ROLE_ADMIN] 이런 형태로 변환
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return jwtAuthenticationConverter;
    }

    /*
        Member Service에 적용할 Spring Security Filter Chain 설정
        Spring Security에서 어떤 요청에 어떤 보안 규칙을 적용할지 정의하는 필터 체인 객체

        공개 API는 인증 없이 접근하도록 허용하고, 나머지 요청은 유효한 JWT 인증을 요구한다.

        Access Token 검증에는 accessTokenDecoder를 사용하며,
        OAuth2 로그인 및 내부 서비스 인증 필터도 함께 구성한다.

        인증 실패는 AuthenticationEntryPointImpl,
        권한 부족은 AccessDeniedHandlerImpl에서 처리
    */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           @Qualifier("accessTokenDecoder") JwtDecoder accessDecoder,
                                           InternalMemberServiceAuthFilter internalMemberServiceAuthFilter) throws Exception {

        // Spring Security의 CSRF(Cross-Site Request Forgery) 보호 기능을 끄는 설정
        // 사용자가 원하지 않는 요청을 다른 사이트가 대신 보내는 공격을 막는 기능
        // JWT를 헤더에 직접 넣어 인증하므로 전통적인 CSRF 위험이 상대적으로 낮음
        // 현재 플젝은 REST API + JWT 구조를 가지고 있음
        return http.csrf(AbstractHttpConfigurer::disable)

                // 어떤 HTTP 요청을 누구에게 허용할지 정하는 설정
                .authorizeHttpRequests(author ->
                        author.requestMatchers(
                                    "/members/internal/**",
                                    "/members/ping",
                                    "/members/register",
                                    "/members/login",
                                    "/members/reissue",
                                    "/members/logout",

                                    // google 로그인 실행 순서 1, 3, 4, 2
                                    "/members/google",
                                    "/members/naver",
                                    "/members/oauth2/exchange",
                                    // Spring Security OAuth2 Login이 내부적으로 사용하는 기본 endpoint 패턴
                                    "/oauth2/**",           // /oauth2/authorization/google
                                    "/login/oauth2/**",     // /login/oauth2/code/google

                                    "/members/email/send",
                                    "/members/email/verify",

                                    "/members/password/reset-request",
                                    "/members/password/reset",

                                    "/members/name/duplicate",
                                    "/members/email/found"
                                )
                                .permitAll()
                                .anyRequest()
                                .authenticated()
                )
                // 서비스는 Bearer JWT를 받아서 인증하는 Resource Server라고 Spring에 알리는 설정
                // .anyRequest().authenticated() 를 사용할 경우 필요
                // JWT가 들어오면 Spring Security한테 Bearer Token을 JWT로 해석해서 인증 상태로 만듬
                .oauth2ResourceServer(oauth2 ->

                        // Bean으로 Spring에 등록한 JwtDecoder를 찾아서 사용
                        // Spring Security가 JWT 인증할 때 해당 converter를 사용
                        oauth2.jwt(jwt ->
                                jwt.decoder(accessDecoder)
                                        .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                )
                // 소셜 계정으로 로그인시 handler 실행
                .oauth2Login(oauth2 ->
                        oauth2.successHandler(oAuth2LoginSuccessHandler)
                                .failureHandler(oAuth2LoginFailureHandler)
                )
                // 내부 서비스 간 요청을 검증하는 필터를 Bearer Token 인증 필터보다 먼저 실행
                .addFilterBefore(internalMemberServiceAuthFilter, BearerTokenAuthenticationFilter.class)
                // Spring Security에서 인증/인가 실패가 발생했을 때 어떻게 응답할지 정하는 설정
                // controller에 도달하기 전에 발생하는 Security 예외이기 때문에 별도 Handler가 필요
                .exceptionHandling(exception -> exception
                        // 인증 실패
                        .authenticationEntryPoint(authenticationEntryPoint)
                        // 인가 실패
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .build();
    }
}
