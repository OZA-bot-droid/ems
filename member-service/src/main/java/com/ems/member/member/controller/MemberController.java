package com.ems.member.member.controller;

import com.ems.member.common.config.ClientIpResolver;
import com.ems.member.common.config.CookieRequestOriginValidator;
import com.ems.member.common.domain.SuccessCode;
import com.ems.member.common.exception.InvalidCredentialsException;
import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.*;
import com.ems.member.member.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/members")
public class MemberController {
    @org.springframework.beans.factory.annotation.Value("${app.public-base-url}")
    private String publicBaseUrl;
    @org.springframework.beans.factory.annotation.Value("${app.cookie-secure:false}")
    private boolean cookieSecure;

    private final MemberService memberService;
    private final AuthService authService;
    private final SocialLoginService socialLoginService;
    private final PasswordResetService passwordResetService;
    private final RateLimiter rateLimiter;
    private final EmailVerificationService emailVerificationService;
    private final CookieRequestOriginValidator originValidator;
    private final ClientIpResolver clientIpResolver;

    public MemberController(MemberService memberService,
                            AuthService authService,
                            SocialLoginService socialLoginService,
                            PasswordResetService passwordResetService,
                            RateLimiter rateLimiter,
                            EmailVerificationService emailVerificationService,
                            CookieRequestOriginValidator originValidator,
                            ClientIpResolver clientIpResolver) {
        this.memberService = memberService;
        this.authService = authService;
        this.socialLoginService = socialLoginService;
        this.passwordResetService = passwordResetService;
        this.rateLimiter = rateLimiter;
        this.emailVerificationService = emailVerificationService;
        this.originValidator = originValidator;
        this.clientIpResolver = clientIpResolver;
    }

    // 회원가입
    // @Valid : DTO 같은 객체 안에 선언된 검증 조건을 실제로 실행하라고 Spring에 알려주는 어노테이션
    @PostMapping("/register")
    public ResponseEntity<?> registerMember(@Valid @RequestBody MemberRegisterDTO dto) {

        memberService.registerMember(dto);
        return new ResponseEntity<>(
                new MessageResponseDTO<>(null, SuccessCode.MEMBER_REGISTERED),
                HttpStatus.CREATED
        );
    }

    // 회원가입 이메일 확인 메일 보내기
    @PostMapping("/email/send")
    public ResponseEntity<?> sendEmailCode(@Valid @RequestBody EmailDTO dto,
                                           HttpServletRequest request) {

        String ip = clientIpResolver.resolve(request);

        // IP별 이메일 발송 횟수 제한
        rateLimiter.checkEmailSendIp(ip);

        // 이메일별 발송 횟수 및 60초 재전송 제한
        emailVerificationService.sendCode(dto.email());

        return ResponseEntity.ok(
                new MessageResponseDTO<>(null, SuccessCode.REQUEST_SUCCESS)
        );
    }

    // 회원가입 이메일 인증코드 확인
    @PostMapping("/email/verify")
    public ResponseEntity<?> verifyEmailCode(@Valid @RequestBody EmailVerificationConfirmDTO dto) {

        emailVerificationService.verifyCode(dto);
        return ResponseEntity.ok(
                new MessageResponseDTO<>(null, SuccessCode.REQUEST_SUCCESS)
        );
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody MemberLoginDTO dto,
                                   HttpServletRequest request) {

        String ip = clientIpResolver.resolve(request);

        // 로그인 시도 제한 확인
        rateLimiter.check(dto.email(), ip);

        try {
            LoginResponseDTO responseDTO = memberService.login(dto);
            rateLimiter.recordSuccess(dto.email(), ip);
            return new ResponseEntity<>(
                    new MessageResponseDTO<>(
                            new AccessTokenResponseDTO(responseDTO.accessToken()),
                            SuccessCode.LOGIN_SUCCESS
                    ),
                    memberService.createRefreshTokenCookie(
                            responseDTO.refreshToken()
                    ),
                    HttpStatus.OK
            );
        } catch (InvalidCredentialsException e) {
            rateLimiter.recordFailure(dto.email(), ip);
            throw e;
        }
    }

    // 새로운 access token 생성
    // @CookieValue : 해당 api에 온 정보 중에 특정 cookie의 값을 가져오는 어노테이션
    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(@RequestBody ClientDTO dto,
                                     @CookieValue("refreshToken") String refreshToken,
                                     HttpServletRequest request) {
        originValidator.validate(request);

        LoginResponseDTO responseDTO = authService.reissue(dto, refreshToken);
        return new ResponseEntity<>(
                new MessageResponseDTO<>(
                        new AccessTokenResponseDTO(responseDTO.accessToken()),
                        SuccessCode.TOKEN_REISSUED
                ),
                memberService.createRefreshTokenCookie(responseDTO.refreshToken()),
                HttpStatus.OK
        );
    }

    // 로그아웃
    @DeleteMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody ClientDTO dto,
                                    @CookieValue("refreshToken") String refreshToken,
                                    HttpServletRequest request) {
        originValidator.validate(request);

        if(refreshToken != null) {
            authService.logout(dto, refreshToken);
        }

        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api/members")   // cookie에서 path가 다를 경우 다른 cookie로 보고 원래 있던 cookie 삭제x
                .maxAge(0)  // cookie 삭제를 의미
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(
                        new MessageResponseDTO<>(
                                new LogoutResponseDTO(true),
                                SuccessCode.LOGOUT_SUCCESS
                        )
                );
    }

    // 회원 정보
    @GetMapping("/me")
    public ResponseEntity<?> myPage(JwtAuthenticationToken authentication) {

        return ResponseEntity.ok(
                new MessageResponseDTO<>(
                        memberService.myPage(authentication.getToken().getSubject()),
                        SuccessCode.REQUEST_SUCCESS
                )
        );
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateMemberName(JwtAuthenticationToken authentication,
                                              @Valid @RequestBody MemberUpdateDTO dto) {
        return ResponseEntity.ok(
                new MessageResponseDTO<>(
                        memberService.updateMember(
                                authentication.getToken().getSubject(),
                                dto
                        ),
                        SuccessCode.REQUEST_SUCCESS
                )
        );
    }


    // google -----------------------------------------------------
    @GetMapping("/google")
    public void googleSignup(@RequestParam String clientId,
                            @RequestParam(required = false) Role role,
                            HttpServletRequest request,
                            HttpServletResponse response) throws IOException {

        HttpSession session = request.getSession();
        session.setAttribute("clientId", clientId);

        if(role != null) {
            session.setAttribute("role", role);
        } else {
            session.removeAttribute("role");
        }

        // Spring Security의 기본 Google 로그인 시작 URL
        response.sendRedirect(publicBaseUrl + "/api/oauth2/authorization/google");
    }

    // naver ---------------------------------------------------
    @GetMapping("/naver")
    public void naverSignup(@RequestParam String clientId,
                            @RequestParam(required = false) Role role,
                            HttpServletRequest request,
                            HttpServletResponse response) throws IOException {

        HttpSession session = request.getSession();
        session.setAttribute("clientId", clientId);

        if(role != null) {
            session.setAttribute("role", role);
        } else {
            session.removeAttribute("role");
        }

        // Spring Security의 기본 Google 로그인 시작 URL
        response.sendRedirect(publicBaseUrl + "/api/oauth2/authorization/naver");
    }

    // 소셜 로그인 token exchange ---------------------------------------------------
    @PostMapping("/oauth2/exchange")
    public ResponseEntity<?> exchange(@RequestParam String code) {

        LoginResponseDTO dto = socialLoginService.getAndRemoveLoginCode(code);

        return new ResponseEntity<>(
                new MessageResponseDTO<>(
                        new AccessTokenResponseDTO(dto.accessToken()),
                        SuccessCode.LOGIN_SUCCESS
                ),
                memberService.createRefreshTokenCookie(dto.refreshToken()),
                HttpStatus.OK
        );
    }

    // password 재설정 이메일 전송 -----------------------------------------------------
    @PostMapping("/password/reset-request")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody EmailDTO dto) {

        passwordResetService.requestResetToken(dto.email());

        // 회원이 없는 이메일이어도 똑같이 200 응답
        // 이메일 존재 여부 노출x
        return ResponseEntity.ok(
                new MessageResponseDTO<>(null, SuccessCode.REQUEST_SUCCESS)
        );
    }

    @PostMapping("/password/reset")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody PasswordResetDTO dto) {

        passwordResetService.resetPassword(dto.token(), dto.newPassword());
        return ResponseEntity.ok(
                new MessageResponseDTO<>(null, SuccessCode.REQUEST_SUCCESS)
        );
    }

    @PostMapping("/password/change")
    public ResponseEntity<?> changePassword(JwtAuthenticationToken authentication,
                                            @Valid @RequestBody PasswordChangeDTO dto) {
        memberService.changePassword(authentication.getToken().getSubject(), dto);

        return ResponseEntity.ok(
                new MessageResponseDTO<>(null, SuccessCode.PASSWORD_RESET_SUCCESS)
        );
    }
}
