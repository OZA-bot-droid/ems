package com.ems.member.member.service;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.RefreshTokenEntity;
import com.ems.member.member.dto.TokenResponseDTO;
import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.repository.MemberRepository;
import com.ems.member.member.repository.RefreshTokenRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenExpiration;

    public MemberService(MemberRepository memberRepository,
                         JwtTokenService jwtTokenService,
                         PasswordEncoder passwordEncoder,
                         RefreshTokenRepository refreshTokenRepository,
                         @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.memberRepository = memberRepository;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    // 회원가입
    public void registerMember(MemberRegisterDTO dto) {

        if(memberRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        memberRepository.save(
                dto.toEntityByBCryptPassword(passwordEncoder.encode(dto.getPassword()))
        );
    }

    // 로그인
    public TokenResponseDTO login(MemberLoginDTO dto) {

        Member member = memberRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("해당 회원은 존재하지 않습니다."));

        if(passwordEncoder.matches(dto.getPassword(), member.getPasswordHash())) {

            String accessToken = jwtTokenService.createAccessToken(member.getId());
            String refreshToken = jwtTokenService.createRefreshToken(member.getId());

            refreshTokenRepository.save(
                    RefreshTokenEntity.builder()
                            .memberId(member.getId())
                            .expiresAt(Instant.now().plusSeconds(refreshTokenExpiration))
                            .token(refreshToken)
                            .build()
            );

            return new TokenResponseDTO(accessToken, refreshToken);

        } else {

            throw new IllegalArgumentException("로그인 실패");
        }
    }
}
