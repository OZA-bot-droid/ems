package com.ems.member.common.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class JwtTokenConfig {

    @Value("${jwt.private-key}")
    private String privateKey;

    @Value("${jwt.public-key}")
    private String publicKey;

    @Bean
    public RSAPrivateKey rsaPrivateKey() throws Exception {

        byte[] keyBytes = Base64.getDecoder().decode(privateKey);

        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);

        KeyFactory keyFactory = KeyFactory.getInstance("RSA");

        return (RSAPrivateKey) keyFactory.generatePrivate(keySpec);
    }

    @Bean RSAPublicKey rsaPublicKey() throws Exception {

        byte[] keyBytes = Base64.getDecoder().decode(publicKey);

        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);

        KeyFactory keyFactory = KeyFactory.getInstance("RSA");

        return (RSAPublicKey) keyFactory.generatePublic(keySpec);
    }

    // jwt encoder
    // JwtEncoder : JWT를 만들어내는 Spring Security의 인터페이스
    @Bean
    public JwtEncoder jwtEncoder() throws Exception {

        // 개인키 파일 읽기
        // 해당 경로에 있는 파일의 문자열을 읽기
        String privateKeyFile = Files.readString(
                Path.of(privateKey)
        );

        // \\s : 정규식에서 공백이나 줄바꿈 같은 공백 문자를 의미
        // Base64로 인코딩된 문자열을 원래 바이트 데이터로 되돌리는 방법
        byte[] privateByte = Base64.getDecoder().decode(
                // replace : 일반 문자열 전체 치환
                // replaceAll : 정규식 기반 전체 치환
                privateKeyFile.replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s", "")
        );

        // RSA 키 객체 생성 - 생성 및 복원에 사용
        // KeyFactory : 키 데이터를 실제 Java Key 객체로 변환하는 클래스
        // getInstance("RSA") : RSA 알고리즘용 키 객체를 만들어낼 KeyFactory를 가져옴
        // RSA : 공개키/개인키를 사용하는 암호화 알고리즘의 종류
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");

        // 바이트 데이터로 개인키 객체를 복원
        // 각각의 RSA 키 객체 생성
        // RSAPrivateKey : 실제로 사용할 RSA 개인키 객체 타입
        // generatePrivate : 키 스펙을 받아서 실제 PrivateKey 객체를 생성
        RSAPrivateKey privateKey = (RSAPrivateKey) keyFactory.generatePrivate(
                // 개인키 데이터를 표현하는 규격
                // 개인키 바이트 데이터가 PKCS#8 형식이라는 걸 나타내는 객체
                // PKCS#8 : 개인키 데이터를 저장하는 표준 포맷
                new PKCS8EncodedKeySpec(privateByte)
        );
        RSAPublicKey publicKey = loadPublicKey();


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


        // NimbusJwtEncoder : Spring Security의 JwtEncoder를 Nimbus JOSE + JWT 라이브러리를 이용해 구현한 클래스
        // 키 정보를 이용해 JWT에 서명
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public JwtDecoder jwtDecoder() throws Exception {

        RSAPublicKey publicKey = loadPublicKey();

        return NimbusJwtDecoder.withPublicKey(publicKey)
                .signatureAlgorithm(SignatureAlgorithm.RS256)
                .build();
    }

    private RSAPublicKey loadPublicKey() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {

        // 공개키 파일 읽기
        String publicKeyFile = Files.readString(
                Path.of(publicKey)
        );
        byte[] publicByte = Base64.getDecoder().decode(

                publicKeyFile.replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s", "")
        );
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");


        // RSAPublicKey : RSA 공개키 객체
        return (RSAPublicKey) keyFactory.generatePublic(
                // 공개키 데이터를 표현하는 규격
                // X509EncodedKeySpec : 공개키 바이트 데이터가 X.509 형식으로 인코딩되어 있다는 걸 Java에 알려주는 객체
                new X509EncodedKeySpec(publicByte)
        );
    }
}

/*
현재 Nimbus JOSE + JWT 라이브러리 사용
- JOSE : 서명하거나 암호화하기 위한 표준 묶음
  - 개념
  - JWS(서명) : 데이터를 서명해서 위조 여부를 검증 가능하게 함
  - JWE(암호화) : 데이터를 암호화해서 내용을 숨김
  - JWK(키 표현) : 공개키/개인키 같은 암호 키를 JSON 형식으로 표현하는 방식


현재 encoding 방식 PKCS#8와 X.509를 선택한 이유
- 표준성, 알고리즘 정보 포함, 호환성, 확장성, 상호운용성
- Java/JCA에서 RSA 키를 다루기 좋은 표준 인코딩 형식이고 상호운용성이 좋기 때문
- oracle java 21 공식 문서 상에서 PKCS8EncodedKeySpec을 PKCS#8 개인키용, X509EncodedKeySpec을 X.509의 SubjectPublicKeyInfo 공개키용으로 제공

1. PKCS#8은 개인키, X.509 SubjectPublicKeyInfo는 공개키와 알고리즘 정보를 표준 구조로 표현, 임의 포맷보다 다른 시스템·라이브러리와 맞추기 쉽기 때문
2. RSA 숫자값만 저장하는 게 아니라, 이 키가 어떤 알고리즘을 사용하는지 식별 정보도 함께 가진다. X.509의 SubjectPublicKeyInfo도 공개키와 함께 알고리즘 식별자를 담는다.
3. java는 PKCS8EncodedKeySpec, X509EncodedKeySpec, KeyFactory를 표준 API로 제공. byte[] -> KeySpec -> RSAPrivateKey/RSAPublicKey 변환이 명확
4. PKCS#8은 RSA 전용 포맷이 아니라 여러 비대칭키 알고리즘을 담을 수 있는 구조라서, 특정 알고리즘 전용 표현보다 범용적이다. RFC 5958도 개인키와 해당 공개키 알고리즘 식별 정보를 함께 담는 구조로 정의
5. RSA 자체의 PKCS#1 키 표현도 존재하지만, RFC 8017에서도 RSA 키 표현이 PKCS#8, X.509 같은 상위 표준에서 사용될 수 있다고 명시한다. 즉 이런 형식은 다른 도구나 보안 라이브러리와 연결하기 좋다.

- 보안은 개인키 보관 방식, 접근 제어, 키 길이, 알고리즘, 키 회전 등에 의해 결정
- SubjectPublicKeyInfo : 공개키를 담아두는 표준 구조
- RSA : 비대칭키 암호 알고리즘
- RFC 5958 : 비대칭키의 개인키 정보를 어떤 구조로 표현할지 정의한 표준 문서(PKCS#8 계열과 관련)
- RFC 8017 : RSA 자체의 규격을 정의한 문서. RSA 키 구조, 암호화, 서명 방식 등을 설명
*/