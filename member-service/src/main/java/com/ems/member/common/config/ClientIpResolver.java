package com.ems.member.common.config;

import com.ems.member.common.exception.InvalidRequestException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/*
    요청 남용 방지를 위한 이메일 인증번호 발송에 횟수 제한 클래스
    클라이언트 IP 주소를 추출하는 클래스

    프록시가 전달한 X-Real-IP 헤더에서 IP 주소를 가져온다.
    로그인 및 이메일 관련 API의 요청 횟수 제한에 사용한다.

    IP 정보가 없거나 쉼표가 포함된 경우 요청을 거부한다.

    X-Real-IP 헤더는 신뢰할 수 있는 프록시가 설정해야 하며,
    외부 사용자가 임의로 위조한 값을 그대로 신뢰해서는 안 된다.
*/
@Component
public class ClientIpResolver {

    // 이메일 주소를 계속 바꿔가며 요청 제한을 우회하는 것을 어렵게 만들기 위해 필요한 것
    /*
        요청 헤더에서 클라이언트 IP를 조회한다.

        X-Real-IP 헤더의 존재 여부와 형식을 검사한 후 반환한다.
        실제 IP의 신뢰성은 앞단 프록시 설정에 의존한다.
    */
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
