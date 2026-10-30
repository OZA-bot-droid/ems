package com.ems.member.member.service;

import com.ems.member.common.exception.MemberLoginException;
import com.ems.member.common.exception.MemberNotFoundException;
import com.ems.member.common.exception.MemberSignupException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.MemberInformationDTO;
import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.repository.MemberRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Service
@Transactional
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

        if(memberRepository.existsByEmail(dto.email())) {
            throw new MemberSignupException("이미 가입된 이메일입니다.");
        }

        memberRepository.save(
                dto.toEntity(
                        passwordEncoder.encode(dto.password())
                )
        );
    }

    // 로그인
    public LoginResponseDTO login(MemberLoginDTO dto) {

        // 회원 존재 여부 => 없으면 401 에러
        Member member = memberRepository.findByEmail(dto.email())
                .orElseThrow(() -> new MemberLoginException("이메일 또는 비밀번호가 일치하지 않습니다."));

        // 비밀번호 확인
        if(passwordEncoder.matches(dto.password(), member.getPasswordHash())) {

            // token 생성
            String accessToken = jwtTokenService.createAccessToken(member.getId(), member.getRole());
            String refreshToken = jwtTokenService.createRefreshToken(member.getId(), member.getRole());

            // refresh token entity 생성 및 DB 저장
            authService.changeRefreshToken(member, refreshToken, dto.clientId());

            return new LoginResponseDTO(accessToken, refreshToken);

        } else {
            throw new MemberLoginException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }
    }

    public MultiValueMap<String, String> headersInCookie(String refreshToken) {

        // 응답에 cookie를 넣어서 client에 저장하기 위함
        ResponseCookie refreshCookie = ResponseCookie
                // 이름, value
                .from("refreshToken", refreshToken)
                // JavaScript에서 접근할 수 없도록 설정
                .httpOnly(true)
                // 모든 API 요청에서 쿠키를 사용할 수 있도록
                .path("/api/members")
                // 로컬 개발은 HTTP라서 false
                // 실제 HTTPS 배포에서는 반드시 true로 변경
                .secure(false)
                // Refresh Token 수명과 맞춤: 7일
                .maxAge(60 * 60 * 24 * 7)
                // CSRF 공격 완화
                // 다른 사이트에서 오는 요청을 어느 정도 허용하면서 보안도 챙김
                // Strict는 매우 엄격
                .sameSite("Lax")
                .build();

        MultiValueMap<String, String> headers = new LinkedMultiValueMap<>();
        headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return headers;
    }

    public MemberInformationDTO myPage(String memberId) {

        Member member = memberRepository.findById(Long.parseLong(memberId))
                .orElseThrow(() -> new MemberNotFoundException("회원을 찾을 수 없습니다."));

        return new MemberInformationDTO(member.getEmail(), member.getName());
    }
}
