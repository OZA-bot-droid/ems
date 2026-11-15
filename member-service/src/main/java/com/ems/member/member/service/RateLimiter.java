package com.ems.member.member.service;

import com.ems.member.common.exception.LoginRateLimitException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

/*
    인증 관련 API의 요청 횟수를 제한하는 서비스

    Caffeine 캐시를 이용해 로그인 실패 횟수와 이메일 발송, 비밀번호 재설정 등의 요청 횟수를 관리

    현재 캐시는 서버 메모리에 저장되므로 애플리케이션 재시작 시 기록이 초기화되고, 여러 서버 인스턴스 간에는 요청 횟수가 공유되지 않는다.
*/
@Service
public class RateLimiter {

    private static final Duration EMAIL_SEND_WINDOW = Duration.ofHours(1);
    private static final int EMAIL_SEND_LIMIT = 5;
    private static final int EMAIL_SEND_IP_LIMIT = 30;
    private static final Duration WINDOW = Duration.ofMinutes(5);
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(5);
    private static final int EMAIL_IP_LIMIT = 5;
    private static final int IP_LIMIT = 30;
    private final Cache<String, Attempt> attempts = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofHours(2))
            .maximumSize(100_000)
            .build();

    private record Attempt(int count, Instant windowStart, Instant blockedUntil) {}
    private String ipKey(String ip) {
        return "ip" + ip;
    }
    private String emailIpKey(String email, String ip) {
        return "email-ip:" + email.trim().toLowerCase(Locale.ROOT) + ":" + ip;
    }

    /*
        특정 IP 또는 이메일/IP 조합이 차단 상태인지 확인
        요청 횟수가 제한에 도달하고 차단 시간이 남아 있으면 true를 반환
    */
    private boolean isBlocked(String key, int limit, Instant now) {
        Attempt attempt = attempts.getIfPresent(key);
        if(attempt == null) return false;

        return attempt.count() >= limit && now.isBefore(attempt.blockedUntil());
    }
    /*
        로그인 실패 횟수를 증가

        기록이 없거나 집계 시간이 종료된 경우 횟수를 초기화
        제한 횟수에 도달하면 차단 종료 시간을 설정

        ConcurrentMap.compute()로 동일 키의 갱신을 원자적으로 처리
    */
    private void increase(String key, int limit, Instant now) {
        attempts.asMap().compute(key, (k, old) -> {
            if(old == null
                    || !now.isBefore(old.windowStart().plus(RateLimiter.WINDOW))
                    || (old.count() >= limit && !now.isBefore(old.blockedUntil()))) {
                return new Attempt(1, now, Instant.EPOCH);
            }

            if(old.count() >= limit) {
                return old;
            }

            int count = old.count() + 1;
            Instant blockedUntil = count >= limit ? now.plus(BLOCK_DURATION) : Instant.EPOCH;

            return new Attempt(count, old.windowStart(), blockedUntil);
        });
    }

    /*
        로그인 요청 전에 IP 및 이메일/IP 조합의 차단 여부를 확인
        제한에 걸린 경우 예외를 발생시킨다.
    */
    public void check(String email, String ip) {
        Instant now = Instant.now();

        if(isBlocked(ipKey(ip), IP_LIMIT, now) || isBlocked(emailIpKey(email, ip), EMAIL_IP_LIMIT, now)) {
            throw new LoginRateLimitException("로그인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    // 로그인 인증 실패 시 IP별 및 이메일/IP별 실패 횟수를 기록
    public void recordFailure(String email, String ip) {
        Instant now = Instant.now();

        increase(ipKey(ip), IP_LIMIT, now);
        increase(emailIpKey(email, ip), EMAIL_IP_LIMIT, now);
    }

    /*
        로그인 성공 시 해당 이메일/IP 조합의 실패 기록을 제거
        IP 전체 실패 기록은 다른 계정에 대한 반복 공격을 고려해 유지
    */
    public void recordSuccess(String email, String ip) {
        attempts.invalidate(emailIpKey(email, ip));
        // IP 전체 실패 기록은 유지
    }

    /*
        이메일 발송 등 인증 관련 API의 공통 요청 횟수 제한 처리

        지정된 키를 기준으로 1시간 동안의 요청 횟수를 관리
        제한에 도달하면 예외를 발생시키고 요청을 거부한다.

        로그인 실패 횟수를 관리하는 increase()와 달리, 실제 API 요청 시점마다 횟수를 증가시킨다.
    */
    private void acquire(String key, int limit) {
        Instant now = Instant.now();

        attempts.asMap().compute(key, (k, old) -> {
            if (old == null
                    || !now.isBefore(old.windowStart().plus(RateLimiter.EMAIL_SEND_WINDOW))) {

                return new Attempt(1, now, Instant.EPOCH);
            }

            if (old.count() >= limit) {
                throw new LoginRateLimitException(
                        "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
                );
            }

            return new Attempt(
                    old.count() + 1,
                    old.windowStart(),
                    Instant.EPOCH
            );
        });
    }

    // 이메일별 1시간 5회
    public void checkEmailSend(String email) {
        String key = "email-send:" + email.trim().toLowerCase(Locale.ROOT);

        acquire(key, EMAIL_SEND_LIMIT);
    }

    // IP별 1시간 30회
    public void checkEmailSendIp(String ip) {
        acquire("email-send-ip:" + ip, EMAIL_SEND_IP_LIMIT);
    }

    /*
        비밀번호 재설정 요청 횟수를 제한
        이메일별 최대 5회, IP별 최대 30회를 허용
    */
    public void checkPasswordReset(String email, String ip) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        acquire("password-reset-email" + normalizedEmail, 5);
        acquire("password-reset-ip"+ ip, 30);
    }

    /**
     * 이메일 찾기 요청 제한
     * IP별 1시간 최대 10회
     *
     * 기존 acquire() 메서드와 Caffeine 캐시를 재사용한다.
     */
    public void checkEmailLookupIp(String ip) {
        acquire("email-lookup-ip:" + ip, 10);
    }
}
