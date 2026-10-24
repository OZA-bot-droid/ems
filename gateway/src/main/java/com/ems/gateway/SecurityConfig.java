package com.ems.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebFluxSecurity  // Spring Security의 WebFlux 설정에서 주입받아 ServerHttpSecurity를 받기
public class SecurityConfig {

    public CorsConfigurationSource corsConfigurationSource() {

        /*
        // application.yaml에 넣을 경우 해당 메서드와 cors 설정이 필요 없음
        spring:
          cloud:
            gateway:
              globalcors:
                add-to-simple-url-handler-mapping: true
                cors-configurations:
                  '[/**]':
                    allowedOrigins:
                      - "http://127.0.0.1:5173"
                      - "http://localhost:5173"
                    allowedMethods:
                      - GET
                      - POST
                      - PUT
                      - PATCH
                      - DELETE
                    allowedHeaders:
                      - "*"
        */

        CorsConfiguration corsConfiguration = new CorsConfiguration();

        corsConfiguration.setAllowedOrigins(List.of("http://localhost:5173/", "http://127.0.0.1:5173/"));
        corsConfiguration.setAllowedHeaders(List.of("*"));
        corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);

        return source;
    }

    // Spring Cloud Gateway는 WebFlux 기반이기에 SecurityFilterChain을 사용하지 않는다.
    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) throws Exception {

        return http.cors(c -> c.configurationSource(corsConfigurationSource()))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(author ->
                        author.anyExchange()
                                .permitAll()
                )
                .build();
    }
}
