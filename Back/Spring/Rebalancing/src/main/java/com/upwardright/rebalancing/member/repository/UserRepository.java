package com.upwardright.rebalancing.member.repository;

import com.upwardright.rebalancing.member.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
}
