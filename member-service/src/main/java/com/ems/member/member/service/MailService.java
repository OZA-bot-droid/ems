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

    private void sendEmail(String email, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

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
