package com.ems.member.member.service;

import com.ems.member.member.domain.RefreshToken;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.RefreshTokenRequestDTO;
import com.ems.member.member.repository.RefreshTokenRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

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
    public void changeRefreshToken(Long memberId, String refreshToken, String clientId) {

        // 기본 세션 종료
        refreshTokenRepository.deleteByMemberIdAndClientId(memberId, clientId);

        // 새 세션 생성
        refreshTokenRepository.save(
                RefreshToken.toBuilder(memberId, refreshToken, clientId, refreshTokenExpiration)
        );
    }

    public void changeRefreshToken(Long memberId, String refreshToken, String clientId, String sessionId) {

        // 기본 세션 종료
        refreshTokenRepository.deleteByMemberIdAndClientId(memberId, clientId);

        // 새 세션 생성
        refreshTokenRepository.save(
                RefreshToken.toBuilder(memberId, refreshToken, clientId, refreshTokenExpiration, sessionId)
        );
    }

    // 새로운 accessToken과 refreshToken 발급
    public LoginResponseDTO reissue(RefreshTokenRequestDTO dto, String refreshToken) {

        // jwt 토큰 검증 및 token 정보 중 member id 가져오기
        Long memberId = jwtTokenService.validateRefreshToken(refreshToken);

        // 회원 존재 여부 확인
        RefreshToken entity = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BadCredentialsException("refresh token이 존재하지 않습니다."));

        // 전달 받은 dto가 null일 수 있기에 Objects.equals가 안전하게 비교
        if(!Objects.equals(entity.getClientId(), dto.clientId())) {
            throw new IllegalArgumentException("클라이언트의 정보가 일치하지 않습니다.");
        }

        // 새로운 accessToken과 refreshToken 발급
        String newAccessToken = jwtTokenService.createAccessToken(memberId);
        String newRefreshToken = jwtTokenService.createRefreshToken(memberId);

        // @Transactional으로 트랜젝션 안에서 실행되어 JPA의 Dirty Checking 때문에 별도로 save()를 다시 호출하지 않아도 수정 가능
        entity.rotate(newRefreshToken, Instant.now().plusSeconds(refreshTokenExpiration));
        // refreshTokenRepository.save(entity);

        return new LoginResponseDTO(newAccessToken, newRefreshToken);
    }

    public void logout(RefreshTokenRequestDTO dto, String refreshToken) {

        RefreshToken refreshTokenEntity = refreshTokenRepository.findByClientIdAndToken(dto.clientId(), refreshToken)
                .orElseThrow(() -> new EntityNotFoundException("클라이언트의 정보가 일치하지 않습니다."));

        refreshTokenRepository.delete(refreshTokenEntity);
    }
}
