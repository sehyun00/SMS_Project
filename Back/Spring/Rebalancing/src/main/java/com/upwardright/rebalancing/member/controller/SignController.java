package com.upwardright.rebalancing.member.controller;

import com.upwardright.rebalancing.member.domain.User;
import com.upwardright.rebalancing.member.dto.SignUpRequest;
import com.upwardright.rebalancing.member.dto.SignUpResponse;
import com.upwardright.rebalancing.member.repository.UserRepository;
import com.upwardright.rebalancing.member.service.SignUpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class SignController {

    private final UserRepository userRepository;
    private final SignUpService signUpService;

    @GetMapping("/upwardright/signup")
    public String signup(Model model) {
        model.addAttribute("signup_test", "회원가입 페이지입니다.");
        return "signup";
    }


    @PostMapping("/upwardright/signup")
    public ResponseEntity<SignUpResponse> signUp(
        @Valid @RequestBody SignUpRequest request) {

    User newUser = request.toEntity();
    User savedUser = signUpService.signUp(newUser);

    return ResponseEntity.ok(
            new SignUpResponse("회원가입 성공", savedUser.getUser_id())
    );
}
}
