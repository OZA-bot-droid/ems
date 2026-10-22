package com.ems.member.member.service;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.repository.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;

    public MemberService(MemberRepository memberRepository,
                         JwtTokenService jwtTokenService,
                         PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    public void registerMember(MemberRegisterDTO dto) {

        if(memberRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        memberRepository.save(
                dto.toEntityByBCryptPassword(passwordEncoder.encode(dto.getPassword()))
        );
    }

    public Map<String, String> login(MemberLoginDTO dto) {

        Member member = memberRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("해당 회원은 존재하지 않습니다."));

        if(passwordEncoder.matches(dto.getPassword(), member.getPasswordHash())) {

            Map<String, String> loginData = new HashMap<>();

            loginData.put("accessToken", jwtTokenService.createAccessToken(member.getId(), Role.USER));
            loginData.put("refreshToken", jwtTokenService.createRefreshToken(member.getEmail(), Role.USER));

            return loginData;

        } else {

            throw new IllegalArgumentException("로그인 실패");
        }
    }
}
