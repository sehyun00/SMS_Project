package com.upwardright.rebalancing.member.service;

import com.upwardright.rebalancing.exception.DuplicateUserIdException;
import com.upwardright.rebalancing.member.domain.User;
import com.upwardright.rebalancing.member.dto.EmailVerificationResponse;
import com.upwardright.rebalancing.member.dto.SendCodeRequest;
import com.upwardright.rebalancing.member.dto.VerifyCodeRequest;
import com.upwardright.rebalancing.member.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;


/*
    클래스 설명 : 해당 클래스는 회원가입 기능을 구현하기 위한 코드로 front에서 보낸 request를 받아 회원가입 처리를 진행하며
    만약 DB의 user_id와 request user_id와 일치할 경우 예외처리를 하여 회원가입이 불가능하도록 구현
    회원가입 성공시 password는 보안성을 위해 인코딩하여 DB에 저장을 진행
 */

@Service
@RequiredArgsConstructor
public class SignUpService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RedisService redisService;

    private static final String EMAIL_AUTH_CODE_PREFIX = "EMAIL_AUTH_CODE:";

    @Value("${auth.code.expiration-millis:300000}")
    private long authCodeExpirationMillis;

    //DB의 user_id colunm 호출
    @Transactional(readOnly = true)
    public boolean existsByUserId(String userId) {
        return userRepository.existsById(userId);  // PK
    }


    @Transactional
    public User signUp(User user) {
        //1.회원가입 시 user_id 중복 시 예외처리
        if (existsByUserId(user.getUser_id())) {
            throw new DuplicateUserIdException("이미 존재하는 아이디입니다.");
        }
        //2.회원가입 성공시 password 인코딩 후 DB에 저장
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);
        return userRepository.save(user);
    }

//
    public void sendCode(SendCodeRequest requestParam) {
        String code = createCode();
        String key = EMAIL_AUTH_CODE_PREFIX + requestParam.email();
        emailService.sendEmail(requestParam.email(), code);
        redisService.saveWithExpiration(key, code, authCodeExpirationMillis);
    }


    private String createCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    public EmailVerificationResponse verifyCode(VerifyCodeRequest requestParam) {
        String findCode = (String) redisService.get(EMAIL_AUTH_CODE_PREFIX + requestParam.email());

        if (findCode == null) {
            return new EmailVerificationResponse(false);
        }

        boolean isVerified = requestParam.code().trim().equals(findCode.trim());
        return new EmailVerificationResponse(isVerified);
    }

}
