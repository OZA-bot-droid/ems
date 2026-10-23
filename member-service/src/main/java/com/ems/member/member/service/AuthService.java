package com.ems.member.member.service;

import com.ems.member.member.domain.RefreshToken;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.RefreshTokenRequestDTO;
import com.ems.member.member.repository.RefreshTokenRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

// 인증 관련 Service
@Service
public class AuthService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenService jwtTokenService;
    private final long refreshTokenExpiration;

    public AuthService(RefreshTokenRepository refreshTokenRepository,
                       JwtTokenService jwtTokenService,
                       @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenService = jwtTokenService;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    // refresh token entity 생성 및 DB 저장
    public void saveRefreshToken(Long memberId, String refreshToken) {

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .memberId(memberId)
                        .token(refreshToken)
                        .expiresAt(Instant.now().plusSeconds(refreshTokenExpiration))
                        .build()
        );
    }

    // 새로운 accessToken과 refreshToken 발급
    public LoginResponseDTO reissue(RefreshTokenRequestDTO dto) {

        // jwt 토큰 검증 및 token 정보 중 member id 가져오기
        Long memberId = jwtTokenService.validateRefreshToken(dto.refreshToken());

        // 회원 존재 여부 확인
        RefreshToken entity = refreshTokenRepository.findByToken(dto.refreshToken())
                .orElseThrow(() -> new EntityNotFoundException("해당 회원은 존재하지 않습니다."));

        // 새로운 accessToken과 refreshToken 발급
        String newAccessToken = jwtTokenService.createAccessToken(memberId);
        String newRefreshToken = jwtTokenService.createRefreshToken(memberId);

        refreshTokenRepository.delete(entity);

        saveRefreshToken(memberId, newRefreshToken);
        return new LoginResponseDTO(newAccessToken, newRefreshToken);
    }
}
