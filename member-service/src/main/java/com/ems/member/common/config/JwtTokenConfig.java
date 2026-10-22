package com.ems.member.common.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class JwtTokenConfig {

    @Value("${jwt.private-key}")
    private String privateKeyPath;

    @Value("${jwt.public-key}")
    private String publicKeyPath;

    @Bean
    public JwtEncoder jwtEncoder() throws Exception {

        // 개인키와 공개키 파일 읽기
        // 해당 경로에 있는 파일의 문자열을 읽기
        String privateKeyFile = Files.readString(
                Path.of(privateKeyPath)
        );
        String publicKeyFile = Files.readString(
                Path.of(publicKeyPath)
        );

        // \\s : 정규식에서 공백이나 줄바꿈 같은 공백 문자를 의미
        byte[] privateByte = Base64.getDecoder().decode(
                privateKeyFile.replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s", "")
        );
        byte[] publicByte = Base64.getDecoder().decode(
                publicKeyFile
                        .replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s", "")
        );

        // RSA 키 객체 생성 - 생성 및 복원에 사용
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");

        // 바이트 데이터로 개인키, 공개키 객체를 복원
        // 각각의 RSA 키 객체 생성
        RSAPrivateKey privateKey = (RSAPrivateKey) keyFactory.generatePrivate(
                // 개인키 데이터를 표현하는 규격
                new PKCS8EncodedKeySpec(privateByte)
        );
        RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(
                // 공개키 데이터를 표현하는 규격
                new X509EncodedKeySpec(publicByte)
        );


        // JWT 발급 관련
        // Nimbus가 사용할 RSA 키 구성
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)     // 개인키를 연결
                .keyID("ems-key-1")     // 키를 식별하기 위한 ID 지정
                .build();


        // JWKSource : 인코더가 서명에 사용할 키를 조회할 수 있도록 제공
        // ImmutableJWKSet : 변경할 수 없는 JWK 집합을 제공
        // SecurityContext : Nimbus의 키 선택 및 처리 과정에서 사용하는 컨텍스트 타입
        JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(

                // 여러 개의 JWK(JSON Web Key)를 묶기
                // JWT 및 암호화 키 관리를 위해 사용
                new JWKSet(rsaKey)
        );


        // NimbusJwtEncoder : Spring Security의 JwtEncoder 구현체
        // 키 정보를 이용해 JWT에 서명
        return new NimbusJwtEncoder(jwkSource);
    }
}
