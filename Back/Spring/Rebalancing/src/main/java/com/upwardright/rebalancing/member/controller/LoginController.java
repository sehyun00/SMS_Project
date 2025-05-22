package com.upwardright.rebalancing.member.controller;

import com.upwardright.rebalancing.member.dto.LoginRequest;
import com.upwardright.rebalancing.member.dto.LoginResponse;
import com.upwardright.rebalancing.member.service.LoginService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LoginController {

    private final LoginService loginService;

    @PostMapping("/upwardright/login")
    public ResponseEntity<LoginResponse> loginProcess(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = loginService.login(loginRequest);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(LoginResponse.builder()
                            .success(false)
                            .message("서버 오류가 발생했습니다: " + e.getMessage())
                            .build());
        }
    }
}
