package com.ems.member.common.config;

import com.ems.member.common.exception.InvalidRequestException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

// 요청 남용 방지
// 이메일 인증번호 발송에 횟수 제한을 하기 위한 클래스
@Component
public class ClientIpResolver {
    // 이메일 주소를 계속 바꿔가며 요청 제한을 우회하는 것을 어렵게 만들기 위해 필요한 것
    public String resolve(HttpServletRequest request) {

        String ip = request.getHeader("X-Real-IP");

        if (ip == null || ip.isBlank()) {
            throw new InvalidRequestException("클라이언트 IP 정보가 없습니다.");
        }

        ip = ip.trim();
        if(ip.contains(",")) {
            throw new InvalidRequestException("클라이언트 IP 형식이 올바르지 않습니다.");
        }

        return ip;
    }
}
