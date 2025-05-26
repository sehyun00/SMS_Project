package com.upwardright.rebalancing.rebalancing.repository;

import com.upwardright.rebalancing.rebalancing.domain.Rebalancing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RebalancingRepository extends JpaRepository<Rebalancing, Integer> {

    // 1.특정 계좌 기록 조회
    @Query("SELECT s FROM Rebalancing s WHERE s.user_id = :user_id AND s.account = :account ORDER BY s.record_id DESC")
    List<Rebalancing> findByUserIdAndAccountOrderByRecordDateDesc(
            @Param("user_id") String user_id,
            @Param("account") String account
    );
}
