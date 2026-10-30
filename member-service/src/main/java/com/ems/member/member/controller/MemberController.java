package com.ems.member.member.controller;

import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.LoginResponseDTO;
import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.dto.RefreshTokenRequestDTO;
import com.ems.member.member.service.AuthService;
import com.ems.member.member.service.MemberService;
import com.ems.member.member.service.SocialLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/members")
public class MemberController {

    private final MemberService memberService;
    private final AuthService authService;
    private final SocialLoginService socialLoginService;

    public MemberController(MemberService memberService,
                            AuthService authService, SocialLoginService socialLoginService) {
        this.memberService = memberService;
        this.authService = authService;
        this.socialLoginService = socialLoginService;
    }

    // 회원가입
    // @Valid : DTO 같은 객체 안에 선언된 검증 조건을 실제로 실행하라고 Spring에 알려주는 어노테이션
    @PostMapping("/register")
    public ResponseEntity<?> registerMember(@Valid @RequestBody MemberRegisterDTO dto) {

        memberService.registerMember(dto);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody MemberLoginDTO dto) {
        LoginResponseDTO responseDTO = memberService.login(dto);

        return new ResponseEntity<>(responseDTO.accessToken(), memberService.headersInCookie(responseDTO.refreshToken()), HttpStatus.OK);
    }

    // 새로운 access token 생성
    // @CookieValue : 해당 api에 온 정보 중에 특정 cookie의 값을 가져오는 어노테이션
    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(@RequestBody RefreshTokenRequestDTO dto, @CookieValue("refreshToken") String refreshToken) {

        LoginResponseDTO responseDTO = authService.reissue(dto, refreshToken);

        return new ResponseEntity<>(responseDTO.accessToken(), memberService.headersInCookie(responseDTO.refreshToken()), HttpStatus.OK);
    }

    // 로그아웃
    @DeleteMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshTokenRequestDTO dto, @CookieValue("refreshToken") String refreshToken) {

        if(refreshToken != null) {
            authService.logout(dto, refreshToken);
        }

        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/members")   // cookie에서 path가 다를 경우 다른 cookie로 보고 원래 있던 cookie 삭제x
                .maxAge(0)  // cookie 삭제를 의미
                .build();

        // MultiValueMap : 하나의 key에 여러 개의 value를 저장할 수 있는 Map 인터페이스
        MultiValueMap<String, String> headers = new LinkedMultiValueMap<>();
        headers.add(HttpHeaders.SET_COOKIE, deleteCookie.toString());

        return new ResponseEntity<>(headers, HttpStatus.OK);
    }

    // 회원 정보
    @GetMapping("/me")
    public ResponseEntity<?> myPage(@RequestHeader("X-Member-Id") String memberId) {

        return new ResponseEntity<>(memberService.myPage(memberId), HttpStatus.OK);
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
        response.sendRedirect("http://localhost:8080/api/oauth2/authorization/google");
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
        response.sendRedirect("http://localhost:8080/api/oauth2/authorization/naver");
    }

    // 소셜 로그인 ---------------------------------------------------
    @PostMapping("/oauth2/exchange")
    public ResponseEntity<?> exchange(@RequestParam String code) {

        LoginResponseDTO dto = socialLoginService.getAndRemove(code);

        return new ResponseEntity<>(
                dto.accessToken(),
                memberService.headersInCookie(dto.refreshToken()),
                HttpStatus.OK
        );
    }
}
