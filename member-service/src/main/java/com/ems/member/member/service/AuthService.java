package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidRefreshTokenException;
import com.ems.member.common.exception.MemberNotFoundException;
import com.ems.member.common.exception.RefreshTokenReusedException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.RefreshToken;
import com.ems.member.member.domain.RefreshTokenHistory;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.RefreshTokenRequestDTO;
import com.ems.member.member.repository.MemberRepository;
import com.ems.member.member.repository.RefreshTokenHistoryRepository;
import com.ems.member.member.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

// 인증 관련 Service
@Service
@Transactional
public class AuthService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenService jwtTokenService;
    private final long refreshTokenExpiration;
    private final MemberRepository memberRepository;
    private final RefreshTokenHistoryRepository refreshTokenHistoryRepository;
    private final RefreshTokenHistoryService refreshTokenHistoryService;

    public AuthService(RefreshTokenRepository refreshTokenRepository,
                       JwtTokenService jwtTokenService,
                       @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration, MemberRepository memberRepository, RefreshTokenHistoryRepository refreshTokenHistoryRepository, RefreshTokenHistoryService refreshTokenHistoryService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenService = jwtTokenService;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.memberRepository = memberRepository;
        this.refreshTokenHistoryRepository = refreshTokenHistoryRepository;
        this.refreshTokenHistoryService = refreshTokenHistoryService;
    }

    // refresh token entity 생성 및 DB 저장
    public void changeRefreshToken(Member member, String refreshToken, String clientId) {

        // 기본 세션 종료
        refreshTokenRepository.deleteByMemberAndClientId(member, clientId);

        // 새 세션 생성
        refreshTokenRepository.save(
                RefreshToken.toBuilder(member, refreshToken, clientId, refreshTokenExpiration)
        );
    }

    public void changeRefreshToken(Member member, String refreshToken, String clientId, String sessionId) {

        // 기본 세션 종료
        refreshTokenRepository.deleteByMemberAndClientId(member, clientId);

        // 새 세션 생성
        refreshTokenRepository.save(
                RefreshToken.toBuilder(member, refreshToken, clientId, refreshTokenExpiration, sessionId)
        );
    }

    // 새로운 accessToken과 refreshToken 발급
    // noRollbackFor : 해당 예외가 발생해도 이 트랜잭션은 rollback하지 않음
    @Transactional(noRollbackFor = RefreshTokenReusedException.class)
    public LoginResponseDTO reissue(RefreshTokenRequestDTO dto, String refreshToken) {

        // jwt 토큰 검증 및 token 정보 중 member id 가져오기
        Long memberId = jwtTokenService.validateRefreshToken(refreshToken);

        // 활성화된 refresh token 조회
        Optional<RefreshToken> optionalEntity = refreshTokenRepository.findByToken(refreshToken);

        // 요청 Refresh Token hash
        String tokenHash = refreshTokenHistoryService.refreshTokenHash(refreshToken);


        // 활성화된 refresh token이 없을 경우
        if(optionalEntity.isEmpty()) {

            // 과거에 사용된 토큰 확인
            Optional<RefreshTokenHistory> history = refreshTokenHistoryRepository.findByTokenHash(tokenHash);
            if(history.isPresent()) {

                RefreshTokenHistory reusedToken = history.get();

                // 현재 활성화된 session 폐기
                refreshTokenRepository.deleteBySessionId(reusedToken.getSessionId());

                throw new RefreshTokenReusedException("이미 사용된 Refresh Token 입니다.");
            }

            // 일반 RuntimeException 규칙 적용 => 발생시 rollback
            // 과거에도 존재하지 않았던 잘못된 토큰
            throw new InvalidRefreshTokenException("유효하지 않은 refresh token입니다.");
        }
        RefreshToken refreshEntity = optionalEntity.get();

        // 회원 존재 여부 확인
        Optional<Member> optionalMember = memberRepository.findById(refreshEntity.getMember().getId());
        if(optionalMember.isEmpty()) {
            throw new MemberNotFoundException("존재하지 않는 회원 입니다.");
        }
        Role role = optionalMember.get().getRole();


        // 폐기할 기존의 refresh token을 history에 기록
        refreshTokenHistoryRepository.save(
                RefreshTokenHistory.builder()
                        .member(refreshEntity.getMember())
                        .sessionId(refreshEntity.getSessionId())
                        .tokenHash(tokenHash)
                        .revokedAt(Instant.now())
                        .build()
        );



        // 전달 받은 dto가 null일 수 있기에 Objects.equals가 안전하게 비교
        if(!Objects.equals(refreshEntity.getClientId(), dto.clientId())) {

            // InvalidRefreshTokenException : clientId까지 포함해서 Refresh Token 세션의 유효성을 검증
            throw new InvalidRefreshTokenException("클라이언트의 정보가 일치하지 않습니다.");
        }


        // 새로운 accessToken과 refreshToken 발급
        String newAccessToken = jwtTokenService.createAccessToken(memberId, role);
        String newRefreshToken = jwtTokenService.createRefreshToken(memberId, role);

        // @Transactional으로 트랜젝션 안에서 실행되어 JPA의 Dirty Checking 때문에 별도로 save()를 다시 호출하지 않아도 수정 가능
        refreshEntity.rotate(newRefreshToken, Instant.now().plusSeconds(refreshTokenExpiration));
        // refreshTokenRepository.save(refreshEntity);

        return new LoginResponseDTO(newAccessToken, newRefreshToken);
    }

    public void logout(RefreshTokenRequestDTO dto, String refreshToken) {

        RefreshToken refreshTokenEntity = refreshTokenRepository.findByClientIdAndToken(dto.clientId(), refreshToken)
                .orElseThrow(() -> new InvalidRefreshTokenException("클라이언트의 정보가 일치하지 않습니다."));

        refreshTokenRepository.delete(refreshTokenEntity);
    }
}
