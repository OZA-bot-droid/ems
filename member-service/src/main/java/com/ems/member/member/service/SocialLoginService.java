package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidRequestException;
import com.ems.member.common.exception.SocialMemberDuplicatedException;
import com.ems.member.common.exception.SocialMemberNotFoundException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.SocialLoginDTO;
import com.ems.member.member.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class SocialLoginService {

    // ConcurrentHashMap : 여러 스레드가 동시에 접근해도 안전하게 사용할 수 있도록 만든 Map 구현 클래스
    private final Map<String, LoginResponseDTO> loginCodes = new ConcurrentHashMap<>();
    private final MemberRepository memberRepository;

    public SocialLoginService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    // 소셜 회원가입
    public void register(SocialLoginDTO dto, Role role) {

        if(memberRepository.existsByProviderAndProviderId(dto.provider(), dto.providerId())) {
            throw new SocialMemberDuplicatedException("이미 가입된 회원입니다.");
        } else {

            memberRepository.save(
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

    public Member login(SocialLoginDTO dto) {
        return memberRepository.findByProviderAndProviderId(dto.provider(), dto.providerId())
                .orElseThrow(() -> new SocialMemberNotFoundException("가입되지 않는 회원입니다."));
    }

    public String save(String accessToken, String refreshToken) {

        String code = UUID.randomUUID().toString();

        loginCodes.put(
                code,
                new LoginResponseDTO(accessToken, refreshToken)
        );

        return code;
    }

    public LoginResponseDTO getAndRemove(String code) {

        LoginResponseDTO result = loginCodes.remove(code);

        if(result == null) {
            throw new InvalidRequestException("유효하지 않은 로그인 코드입니다.");
        }

        return result;
    }
}
