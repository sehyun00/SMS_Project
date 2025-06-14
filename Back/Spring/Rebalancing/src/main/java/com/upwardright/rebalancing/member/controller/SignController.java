package com.upwardright.rebalancing.member.controller;

import com.upwardright.rebalancing.member.domain.User;
import com.upwardright.rebalancing.member.dto.*;
import com.upwardright.rebalancing.member.service.SignUpService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/*
    회원가입 로직
    Front로 올바른 request를 받을 경우 사용자 저장, 만약 사용자가 이미 있을경우 오류처리
    회원가입 중 이메일 인증을 위해 redis를 이용하여 이메일 발송 로직 구현
 */
@RequiredArgsConstructor
@RestController
public class SignController {

    private final SignUpService signUpService;

    @PostMapping("/upwardright/signup")
    public ResponseEntity<SignUpResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        try {
            User newUser = request.toEntity();
            User savedUser = signUpService.signUp(newUser);

            return ResponseEntity.ok(
                    new SignUpResponse("회원가입 성공", savedUser.getUser_id(), true)
            );
        } catch (Exception e) {
            // 이미 존재하는 아이디 예외 체크 (예외 메시지로 판단)
            if (e.getMessage() != null && e.getMessage().contains("이미 존재하는 아이디")) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT) // 409 Conflict
                        .body(new SignUpResponse("이미 존재하는 아이디입니다", request.getUser_id(), false));
            }

            // 기타 서버 에러
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new SignUpResponse("회원가입 중 오류가 발생했습니다: " + e.getMessage(),
                            request.getUser_id(), false));
        }
    }

    @Operation(summary = "이메일 인증 코드 전송")
    @PostMapping("/upwardright/emails/send")
    public ResponseEntity<Void> sendCode(@Valid @RequestBody SendCodeRequest requestParam) {
        signUpService.sendCode(requestParam);
        return ResponseEntity.ok().build();
    }


    @Operation(summary = "이메일 인증 코드 검증")
    @PostMapping("/upwardright/emails/verify")  // GET → POST 변경
    public ResponseEntity<EmailVerificationResponse> verifyCode(@Valid @RequestBody VerifyCodeRequest requestParam) {
        EmailVerificationResponse response = signUpService.verifyCode(requestParam);
        if (response.verified()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

}
