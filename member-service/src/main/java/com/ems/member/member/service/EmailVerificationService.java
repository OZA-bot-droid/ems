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

    /*
        이메일 비교 및 저장에 사용할 형식으로 정규화한다.
        앞뒤 공백을 제거하고 소문자로 통일
    */
    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /*
        회원가입을 위한 이메일 인증번호 발송

        동일 이메일의 인증 정보를 잠금 조회하여 중복 요청을 제어

        6자리 인증번호를 SecureRandom으로 생성하고, DB에는 원본이 아닌 해시값을 저장한다.

        재발송 대기 시간 및 Rate Limiter를 통해 반복 요청을 제한
    */
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

        // 인증번호 원본은 이메일로 발송하고, DB에는 해시값만 저장
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

    /*
        이메일 인증번호 검증

        인증 정보의 만료 여부, 인증 완료 여부, 실패 횟수를 확인
        입력한 인증번호는 DB에 저장된 해시값과 비교

        인증에 실패하면 실패 횟수를 증가시키고, 성공하면 인증 완료 시각을 기록

        실패 시 예외가 발생해도 실패 횟수 변경이 유지되도록 noRollbackFor를 적용한다.
    */
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

    /*
        회원가입 시 인증 완료 여부 확인 및 사용 처리

        인증이 완료되지 않았거나 만료된 경우 회원가입을 거부
        정상적으로 인증된 정보는 회원가입 과정에서 삭제하여 동일한 인증 기록을 다시 사용하지 못하도록 한다.
    */
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
