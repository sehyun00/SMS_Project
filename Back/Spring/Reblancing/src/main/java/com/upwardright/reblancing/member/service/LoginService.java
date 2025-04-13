package com.upwardright.reblancing.member.service;

import com.upwardright.reblancing.member.domain.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.lang.reflect.Member;

public class LoginService {
    // @Query("select m from Member m where m.userId = :userId")

    public User create(String userId, String password, String name, String phonenumber){

        User user = new User();
        user.setUserId(userId);
        user.setPassword(password);
        user.setName(name);
        user.setPhonenumber(phonenumber);

        return user;
    }
    
}
