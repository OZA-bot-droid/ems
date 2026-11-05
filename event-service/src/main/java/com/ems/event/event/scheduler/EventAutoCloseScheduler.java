package com.ems.event.event.scheduler;

import com.ems.event.event.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 끝난 행사 자동 마감 알람시계.
 * 서버가 켜진 직후 한 번, 그 뒤로는 앞 작업이 끝나고 1분마다 EventService.closeEndedEvents()를 부른다.
 * 간격은 application.yml 의 ems.event.auto-close-delay-ms 로 바꿀 수 있음 (기본 60000ms = 1분)
 */
@Component
public class EventAutoCloseScheduler {

    private static final Logger log = LoggerFactory.getLogger(EventAutoCloseScheduler.class);

    private final EventService eventService;

    public EventAutoCloseScheduler(EventService eventService) {
        this.eventService = eventService;
    }

    @Scheduled(initialDelay = 0, fixedDelayString = "${ems.event.auto-close-delay-ms:60000}")
    public void closeEndedEvents() {
        int closed = eventService.closeEndedEvents();
        if (closed > 0) {
            log.info("종료 시각이 지난 행사 {}건을 CLOSED로 자동 마감했습니다.", closed);
        }
    }
}
