package com.upwardright.reblancing.member.repository;

import com.upwardright.reblancing.member.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
}
