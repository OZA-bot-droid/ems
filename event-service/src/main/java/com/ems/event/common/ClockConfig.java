package com.ems.event.common;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * "지금 시각"을 알려주는 시계를 스프링에 등록한다.
 * 서비스가 Instant.now()를 직접 부르지 않고 이 시계를 받아 쓰면,
 * 테스트에서 시계를 원하는 날짜로 고정할 수 있다.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC(); // 서버 시각 기준 (Instant와 같은 UTC)
    }
}
