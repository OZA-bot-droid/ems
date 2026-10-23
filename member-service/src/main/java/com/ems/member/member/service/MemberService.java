package com.ems.member.member.service;

import com.ems.member.member.domain.Member;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.repository.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public MemberService(MemberRepository memberRepository,
                         JwtTokenService jwtTokenService,
                         PasswordEncoder passwordEncoder,
                         AuthService authService) {
        this.memberRepository = memberRepository;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    // 회원가입
    public void registerMember(MemberRegisterDTO dto) {

        if(memberRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        memberRepository.save(
                dto.toEntityByBCryptPassword(
                        passwordEncoder.encode(dto.getPassword())
                )
        );
    }

    // 로그인
    public LoginResponseDTO login(MemberLoginDTO dto) {

        // 회원 존재 여부 => 없으면 401 에러
        Member member = memberRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("해당 회원은 존재하지 않습니다."));

        // 비밀번호 확인
        if(passwordEncoder.matches(dto.getPassword(), member.getPasswordHash())) {

            // token 생성
            String accessToken = jwtTokenService.createAccessToken(member.getId());
            String refreshToken = jwtTokenService.createRefreshToken(member.getId());

            // refresh token entity 생성 및 DB 저장
            authService.saveRefreshToken(member.getId(), refreshToken);

            return new LoginResponseDTO(accessToken, refreshToken);

        } else {
            throw new IllegalArgumentException("로그인 실패");
        }
    }
}
