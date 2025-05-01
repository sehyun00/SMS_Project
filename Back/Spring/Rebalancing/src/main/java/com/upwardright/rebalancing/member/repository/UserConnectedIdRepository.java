package com.upwardright.rebalancing.member.repository;

import com.upwardright.rebalancing.member.domain.UserConnectedId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserConnectedIdRepository extends JpaRepository<UserConnectedId, String> {
    @Query("SELECT COUNT(u) > 0 FROM UserConnectedId u WHERE u.connected_id = :connected_id")
    boolean existsByConnected_id(@Param("connected_id") String connected_id);
}