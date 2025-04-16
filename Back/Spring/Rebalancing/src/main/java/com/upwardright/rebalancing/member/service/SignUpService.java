package com.upwardright.rebalancing.member.service;

import com.upwardright.rebalancing.exception.DuplicateUserIdException;
import com.upwardright.rebalancing.member.domain.User;
import com.upwardright.rebalancing.member.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;




@Service
@RequiredArgsConstructor
public class SignUpService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /*
        user_id(이메일)중복 검사 진행
        존재할 경우 오류 발생
     */
    @Transactional(readOnly = true)
    public boolean existsByUserId(String userId) {
        return userRepository.existsById(userId);  // PK인 경우
    }


    @Transactional
    public User signUp(User user) {
        if (existsByUserId(user.getUser_id())) {
            throw new DuplicateUserIdException("이미 존재하는 아이디입니다.");
        }

        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);
        return userRepository.save(user);
    }
}
