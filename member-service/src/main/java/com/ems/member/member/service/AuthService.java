package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidRefreshTokenException;
import com.ems.member.common.exception.MemberNotFoundException;
import com.ems.member.common.exception.RefreshTokenReusedException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.RefreshToken;
import com.ems.member.member.domain.RefreshTokenHistory;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.ClientDTO;
import com.ems.member.member.repository.MemberRepository;
import com.ems.member.member.repository.RefreshTokenHistoryRepository;
import com.ems.member.member.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

// 인증 관련 Service
@Service
@Transactional
public class AuthService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenService jwtTokenService;
    private final long refreshTokenExpiration;
    private final MemberRepository memberRepository;
    private final RefreshTokenHistoryRepository refreshTokenHistoryRepository;

    public AuthService(RefreshTokenRepository refreshTokenRepository,
                       JwtTokenService jwtTokenService,
                       @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration,
                       MemberRepository memberRepository,
                       RefreshTokenHistoryRepository refreshTokenHistoryRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenService = jwtTokenService;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.memberRepository = memberRepository;
        this.refreshTokenHistoryRepository = refreshTokenHistoryRepository;
    }

    // refresh token entity 생성 및 DB 저장
    public void replaceRefreshToken(Member member, String refreshToken, UUID clientId) {

        // 동일 회원의 로그인 요청을 직렬화하기 위한 행 잠금
        memberRepository.findByIdForUpdate(member.getId())
                .orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원입니다."));

        String tokenHash = hashRefreshToken(refreshToken);
        Optional<RefreshToken> existingToken = refreshTokenRepository.findByMemberAndClientId(member, clientId);

        if(existingToken.isPresent()) {
            RefreshToken token = existingToken.get();
            saveRefreshTokenHistory(token);
            existingToken.get().rotate(
                    tokenHash,
                    Instant.now().plusSeconds(refreshTokenExpiration)
            );
        } else {
            // 처음 로그인하는 클라이언트라면 INSERT(새로운 세션 생성)
            refreshTokenRepository.save(
                    RefreshToken.toBuilder(
                            member,
                            tokenHash,
                            clientId,
                            refreshTokenExpiration
                    )
            );
        }
    }

    public String hashRefreshToken(String refreshToken) {
        try {
            // MessageDigest : 해시 알고리즘을 사용하는 클래스
            // digest : 실제 데이터를 해시값으로 변환하는 메서드
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] tokenHash = messageDigest.digest(refreshToken.getBytes(StandardCharsets.UTF_8));

            // HexFormat.of() : 16진수 변환을 위한 HexFormat 객체 생성
            // formatHex : byte 배열을 16진수 문자열로 변환
            return HexFormat.of().formatHex(tokenHash);
        } catch (NoSuchAlgorithmException e) {
            // INTERNAL_SERVER_ERROR 500
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }

    // 새로운 accessToken과 refreshToken 발급
    // noRollbackFor : 해당 예외가 발생해도 이 트랜잭션은 rollback하지 않음
    @Transactional(noRollbackFor = RefreshTokenReusedException.class)
    public LoginResponseDTO reissue(ClientDTO dto, String refreshToken) {

        // 1. 요청 필수값 확인
        if (dto == null || dto.clientId() == null ||
                refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException(
                    "유효하지 않은 Refresh Token 요청입니다."
            );
        }

        // jwt 토큰 검증 및 token 정보 중 member id 가져오기
        Long memberId = jwtTokenService.validateRefreshToken(refreshToken);

        // 3. 해당 회원 행 잠금
        Member member = memberRepository
                .findByIdForUpdate(memberId)
                .orElseThrow(() ->
                        new InvalidRefreshTokenException("유효하지 않은 Refresh Token입니다.")
                );

        // 활성화된 refresh token 조회
        Optional<RefreshToken> optionalEntity = refreshTokenRepository.findByTokenHash(hashRefreshToken(refreshToken));

        // 요청 Refresh Token hash
        String tokenHash = hashRefreshToken(refreshToken);

        // 활성화된 refresh token이 없을 경우
        if(optionalEntity.isEmpty()) {

            // 과거에 사용된 토큰 확인
            Optional<RefreshTokenHistory> history = refreshTokenHistoryRepository.findByTokenHash(tokenHash);
            if(history.isPresent()) {

                RefreshTokenHistory reusedToken = history.get();

                // 잠근 회원과 이력의 소유자가 일치하는지 검사
                if (!Objects.equals(reusedToken.getMember().getId(), memberId)) {
                    throw new InvalidRefreshTokenException("유효하지 않은 Refresh Token입니다.");
                }

                // 현재 활성화된 session 폐기
                refreshTokenRepository.deleteBySessionId(reusedToken.getSessionId());

                throw new RefreshTokenReusedException("이미 사용된 Refresh Token 입니다.");
            }

            // 일반 RuntimeException 규칙 적용 => 발생시 rollback
            // 과거에도 존재하지 않았던 잘못된 토큰
            throw new InvalidRefreshTokenException("유효하지 않은 refresh token입니다.");
        }
        RefreshToken refreshEntity = optionalEntity.get();

        // 7. 토큰 소유자 및 clientId 검증
        if (!Objects.equals(refreshEntity.getMember().getId(), memberId) ||
                !Objects.equals(refreshEntity.getClientId(), dto.clientId())) {

            throw new InvalidRefreshTokenException("유효하지 않은 Refresh Token입니다.");
        }

        // 8. DB의 만료시간도 검증
        Instant now = Instant.now();
        if (!refreshEntity.getExpiresAt().isAfter(now)) {
            throw new InvalidRefreshTokenException("만료된 Refresh Token입니다.");
        }



        // 회원 존재 여부 확인
        Optional<Member> optionalMember = memberRepository.findById(refreshEntity.getMember().getId());
        if(optionalMember.isEmpty()) {
            throw new MemberNotFoundException("존재하지 않는 회원 입니다.");
        }

        // 회원 존재 확인과 함께 JWT sub가 DB에 저장된 Refresh Token 소유자의 회원 ID와 일치하는지도 검사
        // 폐기할 기존의 refresh token을 history에 기록
        saveRefreshTokenHistory(refreshEntity);

        // 새로운 accessToken과 refreshToken 발급
        Role role = member.getRole();
        String newAccessToken = jwtTokenService.createAccessToken(memberId, role);
        String newRefreshToken = jwtTokenService.createRefreshToken(memberId, role);

        // @Transactional으로 트랜젝션 안에서 실행되어 JPA의 Dirty Checking 때문에 별도로 save()를 다시 호출하지 않아도 수정 가능
        refreshEntity.rotate(hashRefreshToken(newRefreshToken), now.plusSeconds(refreshTokenExpiration));
        refreshTokenRepository.save(refreshEntity);

        return new LoginResponseDTO(newAccessToken, newRefreshToken);
    }

    public void logout(ClientDTO dto, String refreshToken) {

        RefreshToken refreshTokenEntity = refreshTokenRepository.findByClientIdAndTokenHash(dto.clientId(), hashRefreshToken(refreshToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("클라이언트의 정보가 일치하지 않습니다."));

        saveRefreshTokenHistory(refreshTokenEntity);
        refreshTokenRepository.delete(refreshTokenEntity);
    }

    private void saveRefreshTokenHistory(RefreshToken refreshToken) {
        refreshTokenHistoryRepository.save(
                RefreshTokenHistory.builder()
                        .member(refreshToken.getMember())
                        .sessionId(refreshToken.getSessionId())
                        .tokenHash(refreshToken.getTokenHash())
                        .revokedAt(Instant.now())
                        .build()
        );
    }
}
