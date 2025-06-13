package com.upwardright.rebalancing.member.service;

import com.upwardright.rebalancing.exception.UserException;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
/*
    사용자에게 이메일을 보낼 때 제공 양식
 */
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender emailSender;
    private static final String TITLE = "[Stock ReBalancing] Email Verification Code";
    private static final String TEXT_PREFIX = "Please copy and enter the email verification code listed below.\nVerification Code: ";

    public void sendEmail(String email, String code) {
        String text = TEXT_PREFIX + code;
        SimpleMailMessage emailForm = createEmailForm(email, text);

        try {
            emailSender.send(emailForm);
        } catch (RuntimeException e) {
            // 오류 로깅 추가
            System.err.println("이메일 발송 실패: " + e.getMessage());
            e.printStackTrace();
            throw new UserException("이메일 발송에 실패했습니다");
        }
    }

    private SimpleMailMessage createEmailForm(String email, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(TITLE);
        message.setText(text);
        return message;
    }
}
