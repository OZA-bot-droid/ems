package com.ems.member.member.controller;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/members/test")
public class MemberTestController {

    @GetMapping("/user")
    public String user(JwtAuthenticationToken authentication) {
        System.out.println(authentication.getToken().getClaimAsString("role"));
        System.out.println(authentication.getAuthorities());
        return "RBAC user 접근 성공";
    }

    @GetMapping("/admin")
    public String admin(JwtAuthenticationToken authentication) {
        System.out.println(authentication.getToken().getClaimAsString("role"));
        System.out.println(authentication.getAuthorities());
        return "RBAC admin 접근 성공";
    }

    @GetMapping("/all")
    public String allUser(JwtAuthenticationToken authentication) {
        System.out.println(authentication.getToken().getClaimAsString("role"));
        System.out.println(authentication.getAuthorities());
        return "RBAC 접근 성공";
    }
}
