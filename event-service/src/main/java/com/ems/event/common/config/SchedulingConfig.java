package com.ems.event.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * @Scheduled(정해진 시간마다 자동 실행)를 켠다.
 * EventApplication(공용 파일)을 건드리지 않으려고 설정 클래스로 따로 둠.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
