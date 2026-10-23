package com.ems.member.member.controller;

import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.dto.RefreshTokenRequestDTO;
import com.ems.member.member.service.AuthService;
import com.ems.member.member.service.MemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/members")
public class MemberController {

    private final MemberService memberService;
    private final AuthService authService;

    public MemberController(MemberService memberService,
                            AuthService authService) {
        this.memberService = memberService;
        this.authService = authService;
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
    public ResponseEntity<?> accessTokenRefresh(@RequestBody RefreshTokenRequestDTO dto) {

        return new ResponseEntity<>(authService.reissue(dto), HttpStatus.OK);
    }

    // 회원 정보
    @GetMapping("/me")
    public ResponseEntity<?> mypage() {
        return null;
    }
}
