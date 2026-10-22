package com.ems.member.member.controller;

import com.ems.member.member.domain.Role;
import com.ems.member.member.dto.MemberLoginDTO;
import com.ems.member.member.dto.MemberRegisterDTO;
import com.ems.member.member.service.JwtTokenService;
import com.ems.member.member.service.MemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/members")
public class MemberController {

    private final MemberService memberService;
    private final JwtTokenService jwtTokenService;

    public MemberController(MemberService memberService, JwtTokenService jwtTokenService) {
        this.memberService = memberService;
        this.jwtTokenService = jwtTokenService;
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

    // 회원 정보
    @GetMapping("/me")
    public ResponseEntity<?> mypage() {
        return null;
    }

    //
    @GetMapping("/")
    public ResponseEntity<?> admin() {
        return null;

    }
}
