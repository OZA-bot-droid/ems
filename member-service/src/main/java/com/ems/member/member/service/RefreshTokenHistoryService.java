package com.ems.member.member.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class RefreshTokenHistoryService {

    public String refreshTokenHash(String refreshToken) {
        try {
            // MessageDigest : 해시 알고리즘을 사용하는 클래스
            // digest : 실제 데이터를 해시값으로 변환하는 메서드
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] tokenHash = messageDigest.digest(refreshToken.getBytes(StandardCharsets.UTF_8));

            // HexFormat.of() : 16진수 변환을 위한 HexFormat 객체 생성
            // formatHex : byte 배열을 16진수 문자열로 변환
            return HexFormat.of().formatHex(tokenHash);
        } catch (NoSuchAlgorithmException e) {
            // INTERNAL_SERVER_ERROR 500
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }
}
