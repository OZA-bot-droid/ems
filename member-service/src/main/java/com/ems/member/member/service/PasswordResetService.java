package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidPasswordResetTokenException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.PasswordResetToken;
import com.ems.member.member.repository.MemberRepository;
import com.ems.member.member.repository.PasswordResetTokenRepository;
import com.ems.member.member.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Service
@Transactional
public class PasswordResetService {

    private final MemberRepository memberRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MailService mailService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    @Value("${password-reset.token-expiration}") private long passwordResetTokenExpiration;

    public PasswordResetService(MemberRepository memberRepository,
                                PasswordResetTokenRepository passwordResetTokenRepository,
                                MailService mailService,
                                PasswordEncoder passwordEncoder, RefreshTokenRepository refreshTokenRepository) {
        this.memberRepository = memberRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.mailService = mailService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public void requestResetToken(String email) {

        Optional<Member> optionalMember = memberRepository.findByEmail(
                // Locale.ROOT : 실행 환경의 국가나 언어 설정에 영향을 받지 않음
                // toLowerCase : 대문자를 소문자로 변환
                email.trim().toLowerCase(Locale.ROOT)
        );
        if (optionalMember.isEmpty()) {
            // 이메일 계정 존재 여부 숨기기
            return;
        }
        Member member = optionalMember.get();
        if(!"LOCAL".equalsIgnoreCase(member.getProvider())) {
            return;
        }

        // 기존 재설정 토큰 폐기
        passwordResetTokenRepository.deleteByMember(member);

        // 이메일에 들어갈 원본 토큰
        String resetToken = generateResetToken();

        // DB에는 원본이 아닌 SHA-256 해시 저장
        String tokenHash = hashToken(resetToken);

        passwordResetTokenRepository.save(
                PasswordResetToken.toBuilder(
                        member,
                        tokenHash,
                        passwordResetTokenExpiration
                )
        );

        mailService.sendPasswordResetEmail(member.getEmail(), resetToken);
    }

    private String generateResetToken() {

        // 비밀번호 재설정 토큰은 보안용 비밀값
        // 암호학적으로 안전한 랜덤 값 생성
        byte[] bytes = new byte[32];
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] tokenHash = messageDigest.digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(tokenHash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }

    public void resetPassword(String token, String newPassword) {
        String tokenHash = hashToken(token);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidPasswordResetTokenException("유효하지 않은 비밀번호 재설정 토큰입니다."));
        Instant now = Instant.now();

        if(resetToken.getUsedAt() != null) {
            throw new InvalidPasswordResetTokenException("이미 사용된 비밀번호 재설정 토큰입니다.");
        }
        if(!resetToken.getExpiresAt().isAfter(now)) {
            throw new InvalidPasswordResetTokenException("만료된 비밀번호 재설정 토큰입니다.");
        }

        Member member = resetToken.getMember();
        if(!"LOCAL".equalsIgnoreCase(member.getProvider())) {
            throw new InvalidPasswordResetTokenException("유효하지 않은 비밀번호 재설정 토큰입니다.");
        }
        String encodedPassword = passwordEncoder.encode(newPassword);

        member.changePassword(encodedPassword);
        resetToken.use();
        refreshTokenRepository.deleteByMember(member);
    }
}
