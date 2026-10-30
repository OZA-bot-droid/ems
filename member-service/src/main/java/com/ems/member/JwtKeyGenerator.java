package com.ems.member;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

public class JwtKeyGenerator {

    // 나중에 파일을 생성 및 관리하지 않고 AWS KMS(private key)/JWKS(public key) 기반으로 전환 예정
    public static void main(String[] args) throws Exception {

        // RSA 알고리즘(비대칭키 암호화 알고리즘)을 사용하는 키 생성기, 키 크기를 3072비트로 설정
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(3072);

        // 공개키와 개인키를 생성
        KeyPair keyPair = generator.generateKeyPair();


        // 지정한 경로로 Path 객체 생성
        Path keyDirectory = Path.of("C:/Dev/keys");
        Files.createDirectories(keyDirectory);

        // 문자열을 파일로 저장
        Files.writeString(
                // 기존 경로에 파일 이름을 결합
                // .pem은 암호화 키 같은 데이터를 텍스트 형태로 저장할 때 널리 사용하는 파일 형식
                keyDirectory.resolve("private_key.pem"),
                createPem(
                        "PRIVATE KEY",
                        keyPair.getPrivate().getEncoded()
                )
        );

        Files.writeString(
                keyDirectory.resolve("public_key.pem"),
                createPem(
                        "PUBLIC KEY",
                        keyPair.getPublic().getEncoded()
                )
        );
    }

    public static String createPem(String type, byte[] key) {

        // 줄바꿈을 포함하는 Base64 인코더
        // encodeToString : 바이트 배열을 Base64 문자열로 변환
        String encoded = Base64.getMimeEncoder(
                64,
                new byte[]{'\n'}
        ).encodeToString(key);

        return "-----BEGIN " + type + "-----\n"
                + encoded + "\n"
                + "-----END " + type + "-----\n";
    }
}
