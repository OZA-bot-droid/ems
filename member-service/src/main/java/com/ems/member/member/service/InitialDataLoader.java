package com.ems.member.member.service;

import com.ems.member.member.domain.Member;
import com.ems.member.member.repository.MemberRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class InitialDataLoader implements CommandLineRunner {

    private final MemberRepository memberRepository;

    public InitialDataLoader(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public void run(String... args) throws Exception {

        if(memberRepository.findByEmail("admin1234@naver.com").isPresent()) {
            return;
        }

        memberRepository.save(
                Member.builder()
                        .email("admin1234@naver.com")
                        .password("admin1234*")
                        .name("admin")
                        .build()
        );
    }
}
