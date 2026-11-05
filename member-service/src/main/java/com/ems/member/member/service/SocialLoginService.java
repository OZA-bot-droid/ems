package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidCredentialsException;
import com.ems.member.common.exception.InvalidOAuthCodeException;
import com.ems.member.common.exception.MemberEmailDuplicatedException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.SocialLoginDTO;
import com.ems.member.member.repository.MemberRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class SocialLoginService {

    // ConcurrentHashMap : 여러 스레드가 동시에 접근해도 안전하게 사용할 수 있도록 만든 Map 구현 클래스
    private final Map<String, LoginCodeData> loginCodes = new ConcurrentHashMap<>();
    private final MemberRepository memberRepository;

    public SocialLoginService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    // 로그인 코드와 만료 시간 보관
    private record LoginCodeData(LoginResponseDTO tokens, Instant expiresAt) {}

    // 소셜 회원가입
    public Member socialRegister(SocialLoginDTO dto, Role role) {

        if(memberRepository.existsByProviderAndProviderId(dto.provider(), dto.providerId())) {
            throw new MemberEmailDuplicatedException("이미 가입된 회원입니다.");
        } else {

            return memberRepository.save(
                    Member.builder()
                            .provider(dto.provider())
                            .providerId(dto.providerId())
                            .email(dto.email())
                            .name(dto.name())
                            .role(role)
                            .build()
            );
        }
    }

    public Member socialLogin(SocialLoginDTO dto) {
        return memberRepository.findByProviderAndProviderId(dto.provider(), dto.providerId())
                .orElseThrow(() -> new InvalidCredentialsException("가입되지 않는 회원입니다."));
    }

    public UUID saveLoginCode(String accessToken, String refreshToken) {

        UUID code = UUID.randomUUID();

        loginCodes.put(
                code.toString(),
                new LoginCodeData(
                        new LoginResponseDTO(accessToken, refreshToken),
                        // 로그인 코드 만료 시간
                        Instant.now().plusSeconds(60)
                )
        );

        return code;
    }

    public LoginResponseDTO getAndRemoveLoginCode(String code) {

        LoginCodeData loginCodeData = loginCodes.remove(code);

        // null 혹은 만료 여부 확인
        if(loginCodeData == null || !loginCodeData.expiresAt().isAfter(Instant.now())) {
            throw new InvalidOAuthCodeException("유효하지 않은 로그인 코드입니다.");
        }

        return loginCodeData.tokens();
    }

    // 이전 해당 메서드 작업이 완료되고 60초마다 실행
    // _는 가독성을 위한 구분자
    @Scheduled(fixedDelay = 60_000)
    public void removeExpiredLoginCodes() {
        loginCodes.entrySet()
                .removeIf(entry ->
                        !entry.getValue()
                                .expiresAt()
                                .isAfter(
                                        Instant.now()
                                )
                );
    }
}
