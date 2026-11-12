package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidEmailVerificationException;
import com.ems.member.member.domain.EmailVerification;
import com.ems.member.member.dto.EmailVerificationConfirmDTO;
import com.ems.member.member.repository.EmailVerificationRepository;
import com.ems.member.member.repository.MemberRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;

@Service
@Transactional
public class EmailVerificationService {
    private final SecureRandom secureRandom = new SecureRandom();
    private final MemberRepository memberRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final RateLimiter rateLimiter;

    public EmailVerificationService(MemberRepository memberRepository, EmailVerificationRepository emailVerificationRepository, PasswordEncoder passwordEncoder, MailService mailService, RateLimiter rateLimiter) {
        this.memberRepository = memberRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.rateLimiter = rateLimiter;
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    // 인증번호 발송
    public void sendCode(String email) {
        email = normalize(email);
        Instant now = Instant.now();

        // 이미 가입된 계정에는 발송하지 않음
        if(memberRepository.existsByEmail(email)) {
            return;
        }

        EmailVerification verification = emailVerificationRepository
                .findByEmailForUpdate(email)
                .orElse(null);

        if(verification != null && now.isBefore(verification.getResendAt())) {
            throw new InvalidEmailVerificationException("인증번호는 60초 후 다시 요청할 수 있습니다.");
        }
        rateLimiter.checkEmailSend(email);

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        String codeHash = passwordEncoder.encode(code);

        if(verification == null) {
            verification = new EmailVerification(email, codeHash, now);
        } else {
            verification.renew(codeHash, now);
        }

        emailVerificationRepository.save(verification);
        mailService.sendVerificationEmail(email, code);
    }

    @Transactional(noRollbackFor = InvalidEmailVerificationException.class)
    public void verifyCode(EmailVerificationConfirmDTO dto) {
        String email = normalize(dto.email());

        EmailVerification verification = emailVerificationRepository
                .findByEmailForUpdate(email)
                .orElseThrow(() -> new InvalidEmailVerificationException("인증번호가 올바르지 않습니다."));

        Instant now = Instant.now();

        if (!now.isBefore(verification.getExpiresAt())
                || verification.getVerifiedAt() != null
                || verification.getFailedAttempts() >= 5) {
            throw new InvalidEmailVerificationException("인증번호가 만료되었거나 사용할 수 없습니다.");
        }

        if (!passwordEncoder.matches(dto.code(), verification.getCodeHash())) {
            verification.fail();
            throw new InvalidEmailVerificationException("인증번호가 올바르지 않습니다.");
        }

        verification.verify(now);
    }

    // 회원가입 시 인증 완료 여부 확인 및 사용 처리
    public void consumeVerifiedEmail(String email) {
        email = normalize(email);

        EmailVerification verification = emailVerificationRepository
                .findByEmailForUpdate(email)
                .orElseThrow(() -> new InvalidEmailVerificationException("이메일 인증이 필요합니다."));

        if (verification.getVerifiedAt() == null
                || !Instant.now().isBefore(
                verification.getExpiresAt())) {

            throw new InvalidEmailVerificationException("이메일 인증이 필요합니다.");
        }

        emailVerificationRepository.delete(verification);
    }
}
