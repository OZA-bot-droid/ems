package com.ems.member.member.service;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.repository.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtTokenService jwtTokenService;

    public MemberService(MemberRepository memberRepository, JwtTokenService jwtTokenService) {
        this.memberRepository = memberRepository;
        this.jwtTokenService = jwtTokenService;
    }

    public void registerMember(MemberRegisterDTO dto) {

        if(memberRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

//        memberRepository.save(
//                dto.toEntityByBCryptPassword()
//        );

    }

    public Map<String, String> login(MemberLoginDTO dto) {

        Member member = memberRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("해당 회원은 존재하지 않습니다."));

        return null;
    }
}
