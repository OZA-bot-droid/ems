package com.ems.gateway.config;

import com.ems.gateway.error.GatewayErrorWriter;
import com.ems.gateway.error.GatewayErrorCode;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http, GatewayErrorWriter errors) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(
    List.of(
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8088",
        "http://127.0.0.1:8088"
    )
);
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("*"));
        cors.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return http.cors(c -> c.configurationSource(source))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .exceptionHandling(e -> e
                    .authenticationEntryPoint((exchange, ex) -> errors.write(exchange,
                        HttpStatus.UNAUTHORIZED, GatewayErrorCode.UNAUTHORIZED, "인증이 필요합니다."))
                    .accessDeniedHandler((exchange, ex) -> errors.write(exchange,
                        HttpStatus.FORBIDDEN, GatewayErrorCode.FORBIDDEN, "접근 권한이 없습니다.")))
                .authorizeExchange(a -> a.anyExchange().permitAll())
                .build();
    }
}
