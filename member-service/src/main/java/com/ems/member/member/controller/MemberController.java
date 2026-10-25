package com.ems.member.member.controller;

import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.dto.RefreshTokenRequestDTO;
import com.ems.member.member.service.AuthService;
import com.ems.member.member.service.MemberService;
import com.ems.member.member.service.SocialLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    @PostMapping("/register")
    public ResponseEntity<?> registerMember(@RequestBody MemberRegisterDTO dto) {

        memberService.registerMember(dto);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody MemberLoginDTO dto) {

        return new ResponseEntity<>(memberService.login(dto), HttpStatus.OK);
    }

    // 새로운 access token 생성
    @PostMapping("/refresh")
    public ResponseEntity<?> reissue(@RequestBody RefreshTokenRequestDTO dto) {

        return new ResponseEntity<>(authService.reissue(dto), HttpStatus.OK);
    }

    // 로그아웃
    @DeleteMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshTokenRequestDTO dto) {

        authService.logout(dto);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    // 회원 정보
    @GetMapping("/me")
    public ResponseEntity<?> mypage(Authentication authentication) {
        return new ResponseEntity<>(authentication.getName(), HttpStatus.OK);
    }


    // -----------------------------------------------------
    @GetMapping("/google")
    public void googleLogin(@RequestParam String clientId,
                            HttpServletRequest request,
                            HttpServletResponse response) throws IOException {

        request.getSession()
                .setAttribute("clientId", clientId);

        // Spring Security의 기본 Google 로그인 시작 URL
        response.sendRedirect("/oauth2/authorization/google");
    }

    @PostMapping("/oauth/exchange")
    public ResponseEntity<?> exchange(@RequestParam String code) {

        return new ResponseEntity<>(socialLoginService.getAndRemove(code), HttpStatus.OK);
    }
}
