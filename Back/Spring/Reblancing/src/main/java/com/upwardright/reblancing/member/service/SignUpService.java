package com.upwardright.reblancing.member.service;

import com.upwardright.reblancing.member.domain.User;
import com.upwardright.reblancing.member.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class SignUpService {
    // @Query("select m from Member m where m.userId = :userId")

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User create(String userId, String password, String name, String phoneNumber){

        User user = new User();
        user.setUserId(userId);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setPhoneNumber(phoneNumber);
        this.userRepository.save(user);

        return user;
    }
}
