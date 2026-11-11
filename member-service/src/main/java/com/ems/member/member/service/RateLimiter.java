package com.ems.member.member.service;

import com.ems.member.common.exception.LoginRateLimitException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

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
    private boolean isBlocked(String key, int limit, Instant now) {
        Attempt attempt = attempts.getIfPresent(key);
        if(attempt == null) return false;

        return attempt.count() >= limit && now.isBefore(attempt.blockedUntil());
    }
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

    public void check(String email, String ip) {
        Instant now = Instant.now();

        if(isBlocked(ipKey(ip), IP_LIMIT, now) || isBlocked(emailIpKey(email, ip), EMAIL_IP_LIMIT, now)) {
            throw new LoginRateLimitException("로그인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    public void recordFailure(String email, String ip) {
        Instant now = Instant.now();

        increase(ipKey(ip), IP_LIMIT, now);
        increase(emailIpKey(email, ip), EMAIL_IP_LIMIT, now);
    }

    public void recordSuccess(String email, String ip) {
        attempts.invalidate(emailIpKey(email, ip));
        // IP 전체 실패 기록은 유지
    }

    // 공통 요청 횟수 제한
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

    public void checkPasswordReset(String email, String ip) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        acquire("password-reset-email" + normalizedEmail, 5);
        acquire("password-reset-ip"+ ip, 30);
    }
}
