package com.upwardright.rebalancing.member.service;

import com.upwardright.rebalancing.member.domain.User;
import com.upwardright.rebalancing.member.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SignUpService {

    private final UserRepository userRepository;

    @Transactional
    public User signUp(User user) {
        return userRepository.save(user);
    }
}
