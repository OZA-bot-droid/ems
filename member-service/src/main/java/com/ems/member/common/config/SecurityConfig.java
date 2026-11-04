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

@Configuration
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final AuthenticationEntryPointImpl authenticationEntryPoint;
    private final AccessDeniedHandlerImpl accessDeniedHandler;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          AuthenticationEntryPointImpl authenticationEntryPoint,
                          AccessDeniedHandlerImpl accessDeniedHandler) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // jwt의 role claim -> Spring Security의 권한(GrantedAuthority)으로 변환하는 설정
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

    // Spring Security에서 어떤 요청에 어떤 보안 규칙을 적용할지 정의하는 필터 체인 객체
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, @Qualifier("accessTokenDecoder") JwtDecoder accessDecoder) throws Exception {

        // Spring Security의 CSRF(Cross-Site Request Forgery) 보호 기능을 끄는 설정
        // 사용자가 원하지 않는 요청을 다른 사이트가 대신 보내는 공격을 막는 기능
        // JWT를 헤더에 직접 넣어 인증하므로 전통적인 CSRF 위험이 상대적으로 낮음
        // 현재 플젝은 REST API + JWT 구조를 가지고 있음
        return http.csrf(AbstractHttpConfigurer::disable)

                // 어떤 HTTP 요청을 누구에게 허용할지 정하는 설정
                .authorizeHttpRequests(author ->
                        author.requestMatchers(
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

                                    "/members/password/reset-request",
                                    "/members/password/reset"
                                )
                                .permitAll()
                                //.requestMatchers("/members/admin").hasRole("ADMIN")
                                //.requestMatchers("/members/user").hasRole("USER")
                                //.requestMatchers("/members/all").hasAnyRole("USER", "ADMIN")
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
                )
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
