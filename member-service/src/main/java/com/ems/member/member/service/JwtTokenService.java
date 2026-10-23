package com.ems.member.member.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

// token 관련 서비스
@Service
public class JwtTokenService {

    // JwtTokenConfig에서 등록한 NimbusJwtEncoder(JwtEncoder의 하위 클래스)
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final String issuer;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenService(JwtEncoder jwtEncoder,
                           JwtDecoder jwtDecoder,
                           @Value("${jwt.issuer}") String issuer,
                           @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
                           @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.issuer = issuer;
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    // accessToken 생성
    public String createAccessToken(long id) {

        return createToken(id, accessTokenExpiration, "access");
    }

    // refreshToken 생성
    public String createRefreshToken(long id) {

        return createToken(id, refreshTokenExpiration, "refresh");
    }

    // token 생성
    private String createToken(long id, long expiration, String type) {

        // Instant : 특정 시점을 나타내는 클래스
        Instant now = Instant.now();

        // JwtClaimsSet : JWT의 payload 내용을 만드는 클래스
        JwtClaimsSet claimsSet = JwtClaimsSet.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)                     // 발급자 설정
                .issuedAt(now)                      // 발급 시간
                .subject(String.valueOf(id))        // 식별자 설정
                .expiresAt(now.plusSeconds(expiration)) // 만료 시간 설정
                .claim("token_type", type)
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

    // refresh token 확인 및 sub 확인
    public Long validateRefreshToken(String refreshToken) {

        // jwt 토큰 검증
        Jwt jwt = jwtDecoder.decode(refreshToken);

        // refresh token 여부
        if(!"refresh".equals(jwt.getClaimAsString("token_type"))){
            throw new IllegalArgumentException("refresh token이 아님");
        }

        // refresh token이면 sub => member id 가져오기
        return Long.valueOf(jwt.getSubject());
    }
}
