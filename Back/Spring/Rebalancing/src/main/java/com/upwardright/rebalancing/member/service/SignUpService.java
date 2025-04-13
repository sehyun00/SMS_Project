package com.upwardright.rebalancing.member.service;

import com.upwardright.rebalancing.member.domain.User;
import com.upwardright.rebalancing.member.repository.UserRepository;
import lombok.RequiredArgsConstructor;
//import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class SignUpService {
    // @Query("select m from Member m where m.userId = :userId")

    private final UserRepository userRepository;
//    private final PasswordEncoder passwordEncoder;

        public User create(String user_id, String password, String name, String phone_number){

            User user = new User();
            user.setUser_id(user_id);
            user.setPassword(password);
//            user.setPassword(passwordEncoder.encode(password));
            user.setName(name);
            user.setPhone_number(phone_number);
            this.userRepository.save(user);

        return user;
    }
}
