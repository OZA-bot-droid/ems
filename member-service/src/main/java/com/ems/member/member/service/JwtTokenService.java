package com.ems.member.member.service;

import com.ems.member.member.domain.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class JwtTokenService {

    // JwtTokenConfig에서 등록한 NimbusJwtEncoder(JwtEncoder의 하위 클래스)
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final long accessTokenException;

    public JwtTokenService(JwtEncoder jwtEncoder,
                           @Value("${jwt.issuer}") String issuer,
                           @Value("${jwt.access-token-expiration}") long accessTokenException) {
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.accessTokenException = accessTokenException;
    }

    public String createAccessToken(Long id, Role role) {

        Instant now = Instant.now();

        JwtClaimsSet claimsSet = JwtClaimsSet.builder()
                .issuer(issuer)         // 발급자 설정
                .issuedAt(now)          // 발급 시간 설정
                .subject(id.toString()) // 식별자 설정
                .expiresAt(             // 만료 시간 설정
                        now.plus(
                                accessTokenException,
                                ChronoUnit.SECONDS
                        )
                )
                .build();

        // JWT 헤더에 RS256 알고리즘 지정
        // 실제 서명은 JwtEncoder가 설정한 private key를 통해 수행
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();


        // JwtEncoderParameters.from : header와 claimsSet을 발급 입력값으로 묶음
        // encode : JWT를 인코딩하고 서명
        return jwtEncoder.encode(
                JwtEncoderParameters.from(header, claimsSet)
        ).getTokenValue();  // 완성된 JWT Token을 문자열로 변환
    }
}
