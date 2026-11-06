package com.ems.event.event.scheduler;

import com.ems.event.event.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 행사 상태 자동 변경 알람시계.
 * 서버가 켜진 직후 한 번, 그 뒤로는 앞 작업이 끝나고 1분마다
 *   ① 게시일이 된 DRAFT → OPEN (openScheduledEvents)
 *   ② 종료 시각이 지난 DRAFT·OPEN → CLOSED (closeEndedEvents)
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
    public void updateEventStatuses() {
        int opened = eventService.openScheduledEvents();
        if (opened > 0) {
            log.info("게시일이 된 행사 {}건을 OPEN으로 자동 공개했습니다.", opened);
        }
        int closed = eventService.closeEndedEvents();
        if (closed > 0) {
            log.info("종료 시각이 지난 행사 {}건을 CLOSED로 자동 마감했습니다.", closed);
        }
    }
}
