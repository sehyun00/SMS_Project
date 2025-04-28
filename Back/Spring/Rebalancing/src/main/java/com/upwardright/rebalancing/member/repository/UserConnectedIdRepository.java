package com.upwardright.rebalancing.member.repository;

import com.upwardright.rebalancing.member.domain.UserConnectedId;
import com.upwardright.rebalancing.member.domain.UserConnectedIdPK;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserConnectedIdRepository extends JpaRepository<UserConnectedId, UserConnectedIdPK> {

    @Query("SELECT u FROM UserConnectedId u WHERE u.user_id = :user_id")
    List<UserConnectedId> findByUserId(@Param("user_id") String user_id);
}
