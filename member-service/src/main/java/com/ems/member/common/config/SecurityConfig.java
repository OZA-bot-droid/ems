package com.ems.member.common.config;

import com.ems.member.member.handler.OAuth2LoginSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
    }

//    @Bean
//    public PasswordEncoder passwordEncoder() {
//        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
//    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        return http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(author ->
                        author.requestMatchers(
                                    "/members/ping",
                                    "/members/register",
                                    "/members/login",
                                    "/members/refresh",
                                    "/members/logout",
                                    "/members/oauth2/**",
                                    "/members/login/oauth2/**"
                                )
                                .permitAll()
                                .anyRequest()
                                .authenticated()
                )
                // 서비스는 Bearer JWT를 받아서 인증하는 Resource Server라고 Spring에 알리는 설정
                // .anyRequest().authenticated() 를 사용할 경우 필요
                // JWT가 들어오면 Spring Security한테 Bearer Token을 JWT로 해석해서 인증 상태로 만듬
                .oauth2ResourceServer(oauth2 ->

                        // {} : 별도의 세부 설정을 추가하지 않고 기본 JWT 인증 방식을 사용
                        // Bean으로 Spring에 등록한 JwtDecoder를 찾아서 사용
                        oauth2.jwt(jwt -> {})
                )
                // google 계정으로 로그인
                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2LoginSuccessHandler))
                .build();
    }
}
