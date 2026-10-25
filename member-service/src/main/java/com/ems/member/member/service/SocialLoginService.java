package com.ems.member.member.service;

import com.ems.member.member.domain.Member;
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

    private final Map<String, LoginResponseDTO> loginCodes = new ConcurrentHashMap<>();
    private final MemberRepository memberRepository;

    public SocialLoginService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public Member login(SocialLoginDTO dto) {
        return memberRepository.findByProviderAndProviderId(dto.provider(), dto.providerId())
                .orElseGet(() -> createSocialMemberEntity(dto));
    }

    private Member createSocialMemberEntity(SocialLoginDTO dto) {

        return memberRepository.save(
                Member.builder()
                        .email(dto.email())
                        .name(dto.name())
                        .provider(dto.provider())
                        .providerId(dto.providerId())
                        .build()
        );
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
            throw new IllegalArgumentException("유효하지 않은 로그인 코드입니다.");
        }

        return result;
    }
}
