package com.upwardright.rebalancing.member.repository;

import com.upwardright.rebalancing.member.domain.UserConnectedId;
import com.upwardright.rebalancing.member.domain.UserConnectedIdPK;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserConnectedIdRepository extends JpaRepository<UserConnectedId, UserConnectedIdPK> {
    @Query("SELECT COUNT(u) > 0 FROM UserConnectedId u WHERE u.connected_id = :connected_id")
    boolean existsByConnected_id(@Param("connected_id") String connected_id);

    // user_id 필드에 대한 명시적 쿼리
    @Query("SELECT u FROM UserConnectedId u WHERE u.user_id = :user_id")
    List<UserConnectedId> findByUserId(@Param("user_id") String user_id);
}
