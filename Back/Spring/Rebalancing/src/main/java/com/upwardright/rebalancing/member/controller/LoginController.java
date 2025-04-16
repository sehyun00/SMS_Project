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
@CrossOrigin(origins = "http://localhost:3000") // React 앱의 URL을 명시 (개발 환경용)
public class LoginController {

    private final LoginService loginService;

    @GetMapping("/upwardright/login")
    public String signup(Model model) {
        model.addAttribute("login_test", "로그인 페이지입니다.");
        return "login";
    }

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
