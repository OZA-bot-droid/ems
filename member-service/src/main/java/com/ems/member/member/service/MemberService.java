package com.ems.member.member.service;

import com.ems.member.common.exception.InvalidCredentialsException;
import com.ems.member.common.exception.MemberNameDuplicatedException;
import com.ems.member.common.exception.MemberNotFoundException;
import com.ems.member.common.exception.MemberEmailDuplicatedException;
import com.ems.member.member.domain.Member;
import com.ems.member.member.dto.*;
import com.ems.member.member.repository.MemberRepository;
import com.ems.member.member.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.Locale;

@Service
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationService emailVerificationService;
    @Value("${app.cookie-secure:false}") private boolean cookieSecure;

    public MemberService(MemberRepository memberRepository,
                         JwtTokenService jwtTokenService,
                         PasswordEncoder passwordEncoder,
                         AuthService authService,
                         RefreshTokenRepository refreshTokenRepository,
                         EmailVerificationService emailVerificationService) {
        this.memberRepository = memberRepository;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailVerificationService = emailVerificationService;
    }

    // 회원가입
    public void registerMember(MemberRegisterDTO dto) {

        if(memberRepository.existsByEmail(dto.email())) {
            throw new MemberEmailDuplicatedException("이미 가입된 이메일입니다.");
        }
        if(memberRepository.existsByName(dto.name().trim())) {
            throw new MemberNameDuplicatedException("이미 사용 중인 닉네임입니다.");
        }

        // 이메일 인증 확인
        emailVerificationService.consumeVerifiedEmail(dto.email());

        // 회원 저장
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
                .orElseThrow(() -> new InvalidCredentialsException("이메일 또는 비밀번호가 일치하지 않습니다."));
        if(!"LOCAL".equalsIgnoreCase(member.getProvider())) {
            throw new InvalidCredentialsException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        // 비밀번호 확인
        if(passwordEncoder.matches(dto.password(), member.getPasswordHash())) {

            // token 생성
            String accessToken = jwtTokenService.createAccessToken(member.getId(), member.getRole());
            String refreshToken = jwtTokenService.createRefreshToken(member.getId(), member.getRole());

            // refresh token entity 생성 및 DB 저장
            authService.replaceRefreshToken(member, refreshToken, dto.clientId());

            return new LoginResponseDTO(accessToken, refreshToken);

        } else {
            throw new InvalidCredentialsException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }
    }

    public MultiValueMap<String, String> createRefreshTokenCookie(String refreshToken) {

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
                .secure(cookieSecure)
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

        return new MemberInformationDTO(member);
    }

    // Event Service가 신청 시점의 회원 이름과 이메일을 저장할 수 있도록 조회합니다.
    @Transactional(readOnly = true)
    public RegistrationApplicantProfile findRegistrationApplicantProfile(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException("회원을 찾을 수 없습니다."));
        return new RegistrationApplicantProfile(member.getId(), member.getName(), member.getEmail());
    }

    public void changePassword(String memberId, PasswordChangeDTO dto) {

        Member member = memberRepository.findById(Long.parseLong(memberId))
                .orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원입니다."));

        // 자체 로그인 회원만 비밀번호 변경
        if(!"LOCAL".equalsIgnoreCase(member.getProvider())) {
            throw new InvalidCredentialsException("비밀번호 변경에 실패했습니다.");
        }

        // 현재 비밀번호 검증
        // 기존 비밀번호와 새로운 비밀번호가 동일한지 확인
        // 일치 여부를 알려주는 oracle 역할을 할 수 있으니 주의
        if(!passwordEncoder.matches(dto.currentPassword(), member.getPasswordHash())
                || passwordEncoder.matches(dto.newPassword(), member.getPasswordHash())) {
            throw new InvalidCredentialsException("비밀번호 변경에 실패했습니다.");
        }

        // 새로운 비밀번호 저장
        member.changePassword(passwordEncoder.encode(dto.newPassword()));

        // 모든 기기의 refresh token 폐기
        refreshTokenRepository.deleteByMember(member);
    }

    public MemberInformationDTO updateMember(String memberId, MemberUpdateDTO dto) {

        Member member = memberRepository.findById(Long.parseLong(memberId))
                .orElseThrow(() -> new MemberNotFoundException("존재하지 않은 회원입니다."));

        String name = dto.name().trim();
        if(!member.getName().equals(name) && memberRepository.existsByName(name)) {
            throw new MemberNameDuplicatedException("이미 사용 중인 닉네임입니다.");
        }

        member.changeName(name);
        return new MemberInformationDTO(member);
    }

    public boolean duplicateName(NameDTO dto) {

        return memberRepository.existsByName(dto.name());
    }


    public String foundEmail(NameDTO dto) {
        // 닉네임으로 회원을 조회
        Member member = memberRepository.findByName(dto.name())
                .orElseThrow(() ->
                        new MemberNotFoundException("존재하지 않는 회원입니다.")
                );

        // 이메일 원문을 반환하지 않고 마스킹한 값만 반환
        return maskEmail(member.getEmail());
    }

    /**
     * 이메일 아이디의 앞 2글자만 표시하고 나머지를 *로 변경.
     * 도메인은 기존 주소를 구분할 수 있도록 유지.
     *
     * honggildong@gmail.com -> ho********@gmail.com
     * abc@naver.com          -> ab*@naver.com
     * ab@gmail.com           -> a*@gmail.com
     * a@gmail.com            -> *@gmail.com
     */
    private String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("회원 이메일 정보가 없습니다.");
        }

        int atIndex = email.indexOf('@');

        if (atIndex <= 0 || atIndex == email.length() - 1) {
            throw new IllegalStateException("잘못된 이메일 형식입니다.");
        }

        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);

        int visibleCount = localPart.length() <= 2
                ? Math.max(0, localPart.length() - 1)
                : 2;

        String visible = localPart.substring(0, visibleCount);
        String masked = "*".repeat(localPart.length() - visibleCount);

        return visible + masked + domain;
    }

}
