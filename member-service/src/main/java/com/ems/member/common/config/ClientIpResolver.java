package com.ems.member.common.config;

import com.ems.member.common.exception.InvalidRequestException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {
    // 이메일 주소를 계속 바꿔가며 요청 제한을 우회하는 것을 어렵게 만들기 위해 필요한 것
    public String resolve(HttpServletRequest request) {
        String ip = request.getHeader("X-EMS-Client-IP");

        if (ip == null || ip.isBlank()) {
            throw new InvalidRequestException("클라이언트 IP 정보가 없습니다.");
        }

        return ip;
    }
}
