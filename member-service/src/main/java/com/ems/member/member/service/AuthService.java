package com.ems.member.member.service;

import com.ems.member.member.domain.RefreshToken;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.RefreshTokenRequestDTO;
import com.ems.member.member.repository.RefreshTokenRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

// 인증 관련 Service
@Service
@Transactional
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
    public void saveRefreshToken(Long memberId, String refreshToken, String clientId) {

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .memberId(memberId)
                        .token(refreshToken)
                        .clientId(clientId)
                        .sessionId(UUID.randomUUID().toString())
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
                .orElseThrow(() -> new EntityNotFoundException("refresh token이 존재하지 않습니다."));

        // 전달 받은 dto가 null일 수 있기에 Objects.equals가 안전하게 비교
        if(!Objects.equals(entity.getClientId(), dto.clientId())) {
            throw new IllegalArgumentException("클라이언트의 정보가 일치하지 않습니다.");
        }

        // 새로운 accessToken과 refreshToken 발급
        String newAccessToken = jwtTokenService.createAccessToken(memberId);
        String newRefreshToken = jwtTokenService.createRefreshToken(memberId);

        refreshTokenRepository.delete(entity);

        saveRefreshToken(memberId, newRefreshToken, dto.clientId());
        return new LoginResponseDTO(newAccessToken, newRefreshToken);
    }

    public void logout(RefreshTokenRequestDTO dto) {

        RefreshToken refreshToken = refreshTokenRepository.findByClientIdAndToken(dto.clientId(), dto.refreshToken())
                .orElseThrow(() -> new EntityNotFoundException("클라이언트의 정보가 일치하지 않습니다."));

        refreshTokenRepository.delete(refreshToken);
    }
}
