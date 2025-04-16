package com.upwardright.rebalancing.member.service;

import com.upwardright.rebalancing.member.domain.User;
import com.upwardright.rebalancing.member.dto.LoginRequest;
import com.upwardright.rebalancing.member.dto.LoginResponse;
import com.upwardright.rebalancing.member.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
    클래스 설명 : 해당 클래스는 로그인 기능을 구현하기 위한 코드로 front의 request를 통해 DB의 user_id와 password와 유효성 검사를 통해
    로그인 성공시 JWT토큰을 발행하고 아이디가 존재하지 않거나 비밀번호가 존재하지 않을 경우 오류 내용을 표현
 */
@Service
@RequiredArgsConstructor
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    // JWT 토큰 생성을 위한 유틸리티를 사용할 경우
    // private final JwtTokenProvider jwtTokenProvider;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 1. 아이디로 사용자 찾기
        return userRepository.findById(request.getUser_id())
                .map(user -> {
                    // 2. 비밀번호 확인
                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        // 3. 로그인 성공 - JWT 토큰 생성
                        String token = generateToken(user);
                        return LoginResponse.builder()
                                .success(true)
                                .token(token)
                                .user_id(user.getUser_id())
                                .name(user.getName())
                                .message("로그인 성공")
                                .build();
                    } else {
                        // 비밀번호 불일치
                        return LoginResponse.builder()
                                .success(false)
                                .message("비밀번호가 일치하지 않습니다")
                                .build();
                    }
                })
                .orElse(LoginResponse.builder()
                        .success(false)
                        .message("존재하지 않는 사용자입니다")
                        .build());
    }

    // JWT 토큰 생성 메서드 (실제 구현은 JWT 라이브러리 필요)
    private String generateToken(User user) {
        // JWT 토큰 생성 로직
        // 예: return jwtTokenProvider.createToken(user.getUser_id());

        // 임시 구현 (실제로는 JWT 라이브러리를 사용하여 구현)
        return "sample-jwt-token-" + System.currentTimeMillis();
    }
}
