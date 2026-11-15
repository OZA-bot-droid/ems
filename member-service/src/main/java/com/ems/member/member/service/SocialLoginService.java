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

    /*
        소셜 회원가입
        소셜 로그인 제공자의 사용자 정보로 회원가입

        동일한 이메일로 가입된 회원이 있으면 중복 가입을 거부
        소셜 제공자 정보(provider, providerId)를 저장하여 이후 로그인 시 회원을 식별할 수 있도록 한다.

        닉네임이 중복되면 별도의 고유 닉네임을 생성
    */
    public Member socialRegister(SocialLoginDTO dto, Role role) {

        if(memberRepository.existsByEmail(dto.email())) {
            throw new MemberEmailDuplicatedException("이미 가입된 회원입니다.");
        } else {

            return memberRepository.save(
                    Member.builder()
                            .provider(dto.provider())
                            .providerId(dto.providerId())
                            .email(dto.email())
                            .name(generateUniqueName(dto.name()))
                            .role(role)
                            .build()
            );
        }
    }

    /*
        소셜 로그인 사용자의 중복되지 않는 닉네임 생성

        제공자에게 받은 이름이 없으면 user를 기본값으로 사용
        이미 사용 중인 닉네임이면 UUID 일부를 붙여 중복을 피한다.
    */
    private String generateUniqueName(String providerName) {
        if (providerName == null || providerName.isBlank()) {
            providerName = "user";
        }

        providerName = providerName.trim();
        if (!memberRepository.existsByName(providerName)) {
            return providerName;
        }

        String name;
        do {
            name = providerName + "_" + UUID.randomUUID().toString().substring(0, 8);
        } while (memberRepository.existsByName(name));

        return name;
    }

    /*
        소셜 로그인 제공자와 제공자 사용자 ID로 회원을 조회

        이메일이 아닌 provider와 providerId를 기준으로 회원을 식별하며,
        가입되지 않은 회원이라면 인증 예외를 발생시킨다.
    */
    public Member socialLogin(SocialLoginDTO dto) {
        return memberRepository.findByProviderAndProviderId(dto.provider(), dto.providerId())
                .orElseThrow(() -> new InvalidCredentialsException("가입되지 않는 회원입니다."));
    }

    /*
        OAuth2 로그인 성공 후 토큰 교환용 일회성 코드를 생성한다.

        Access Token과 Refresh Token을 서버 메모리에 보관하고,
        프론트엔드에는 실제 JWT 대신 UUID 코드를 전달한다.

        로그인 코드는 생성 후 60초 동안 유효하다.
        현재 ConcurrentHashMap 기반이므로 서버 재시작 시 소멸하며,
        여러 서버 인스턴스 사이에 공유되지 않는다.
    */
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

    /*
        일회용 로그인 코드를 검증하고 저장된 토큰을 반환

        코드를 조회하면서 Map에서 제거하여 재사용을 방지
        코드가 없거나 만료된 경우 인증 예외를 발생시킨다.
    */
    public LoginResponseDTO getAndRemoveLoginCode(String code) {

        LoginCodeData loginCodeData = loginCodes.remove(code);

        if(loginCodeData == null || !loginCodeData.expiresAt().isAfter(Instant.now())) {
            throw new InvalidOAuthCodeException("유효하지 않은 로그인 코드입니다.");
        }

        return loginCodeData.tokens();
    }

    /*
        사용되지 않고 만료된 로그인 코드를 정리

        이전 실행이 끝난 후 60초 간격으로 실행되며,
        만료 시간이 지난 코드만 메모리에서 제거한다.

        _는 가독성을 위한 구분자
    */
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
