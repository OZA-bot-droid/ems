package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidRefreshTokenException;
import com.ems.member.common.exception.MemberNotFoundException;
import com.ems.member.member.domain.Role;
import com.ems.member.member.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Qualifier;
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
    private final MemberRepository memberRepository;
    private final String issuer;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    private final JwtDecoder refreshDecoder;

    public JwtTokenService(JwtEncoder jwtEncoder,
                           MemberRepository memberRepository,
                           @Value("${jwt.issuer}") String issuer,
                           @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
                           @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration,
                           @Qualifier("refreshTokenDecoder")JwtDecoder refreshDecoder) {
        this.jwtEncoder = jwtEncoder;
        this.memberRepository = memberRepository;
        this.issuer = issuer;
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.refreshDecoder = refreshDecoder;
    }

    /*
        accessToken 생성
        회원 ID와 권한을 JWT에 포함
        설정된 Access Token 유효기간을 적용
    */
    public String createAccessToken(long id, Role role) {
        return createToken(id, accessTokenExpiration, "access", role);
    }
    // 소셜 로그인용
    public String createAccessToken(long id) {
        return createAccessToken(
                id,
                memberRepository.findById(id)
                        .orElseThrow(() -> new MemberNotFoundException("해당 회원은 존재하지 않습니다."))
                        .getRole()
        );
    }

    /*
        refreshToken 생성
        Access Token과 동일한 JWT 서명 방식을 사용
        단, token_type을 refresh로 지정하고 별도의 만료 시간을 적용

        발급된 토큰의 해시 저장과 Rotation 처리는 AuthService에서 담당
    */
    public String createRefreshToken(long id, Role role) {
        return createToken(id, refreshTokenExpiration, "refresh", role);
    }
    // 소셜 로그인용
    public String createRefreshToken(long id) {
        return createRefreshToken(
                id,
                memberRepository.findById(id)
                        .orElseThrow(() -> new MemberNotFoundException("해당 회원은 존재하지 않습니다."))
                        .getRole()
        );
    }

    /*
        token 생성
        JWT Payload에 회원 ID, 권한, 토큰 종류, 발급 및 만료 시간을 설정
        jti에는 매번 새로운 UUID를 부여해 토큰을 구별

        RS256 알고리즘을 사용해 개인키로 서명
    */
    private String createToken(long id, long expiration, String type, Role role) {

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
                .claim("role", role.name())
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

    /*
        Refresh Token의 JWT 유효성을 검증하고 회원 member id를 반환

        JwtDecoder를 이용해 서명과 설정된 검증 조건을 확인
        token_type이 refresh가 아니면 요청을 거부

        DB에 저장된 활성 토큰 여부, clientId, 재사용 여부는 AuthService.reissue()에서 추가로 검증
    */
    public Long validateRefreshToken(String refreshToken) {

        try {
            // jwt 토큰 검증
            Jwt jwt = refreshDecoder.decode(refreshToken);

            // refresh token 여부
            if (!"refresh".equals(jwt.getClaimAsString("token_type"))) {
                throw new InvalidRefreshTokenException("유효하지 않은 refresh token입니다.");
            }

            // refresh token이면 sub => member id 가져오기
            return Long.valueOf(jwt.getSubject());
        } catch(JwtException | NumberFormatException e) {
            throw new InvalidRefreshTokenException("유효하지 않은 refresh token입니다.");
        }
    }
}
