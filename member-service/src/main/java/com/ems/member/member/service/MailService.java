package com.ems.member.member.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final String frontendUrl;

    public MailService(JavaMailSender mailSender,
                       @Value("${password-reset.frontend-url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
    }

    /*
        이메일 발송 공통 처리

        수신자, 제목, 본문을 설정한 뒤 JavaMailSender를 이용해 이메일을 발송한다.

        인증번호 발송과 비밀번호 재설정 메일에서 공통으로 사용한다.
    */
    private void sendEmail(String email, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    /*
        비밀번호 재설정 안내 이메일 발송

        프론트엔드 비밀번호 재설정 주소에 일회용 토큰을 포함하여
        사용자가 이메일 링크를 통해 비밀번호를 변경할 수 있도록 한다.

        토큰의 유효성 및 사용 여부는 PasswordResetService에서 검증한다.
    */
    public void sendPasswordResetEmail(String email, String resetToken) {
        sendEmail(
                email,
                "EMS 비밀번호 재설정",
                """
                비밀번호 재설정을 요청하셨습니다.
                
                아래 링크를 통해 비밀번호를 재설정해주세요.
                
                %s
                
                이 링크는 일정 시간이 지나면 만료됩니다.
                
                본인이 요청하지 않았다면 이 메일을 무시해주세요.
                """.formatted(
                        frontendUrl + "/password/reset?token=" + resetToken
                )
        );
    }

    /*
        회원가입 이메일 인증번호 발송

        EmailVerificationService에서 생성한 6자리 인증번호를 사용자 이메일로 전달한다.

        인증번호의 만료 시간과 검증은 EmailVerificationService에서 관리한다.
    */
    public void sendVerificationEmail(String email, String code) {
        sendEmail(
                email,
                "EMS 회원가입 이메일 인증",
                """
                EMS 회원가입 인증번호는 다음과 같습니다.
    
                %s
    
                인증번호는 5분 동안 유효합니다.
                본인이 요청하지 않았다면 이 메일을 무시해주세요.
                """.formatted(code)
        );
    }
}
