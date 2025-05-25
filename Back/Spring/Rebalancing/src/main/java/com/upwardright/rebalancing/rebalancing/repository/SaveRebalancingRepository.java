package com.upwardright.rebalancing.rebalancing.repository;

import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaveRebalancingRepository extends JpaRepository<SaveRebalancing, Integer> {

    // 특정 사용자의 특정 계좌 기록 조회
    @Query("SELECT s FROM SaveRebalancing s WHERE s.user_id = :user_id AND s.account = :account ORDER BY s.record_id DESC")
    List<SaveRebalancing> findByUserIdAndAccountOrderByRecordDateDesc(
            @Param("user_id") String user_id,
            @Param("account") String account
    );

    // 특정 사용자의 모든 기록 조회
    @Query("SELECT s FROM SaveRebalancing s WHERE s.user_id = :user_id ORDER BY s.record_id DESC")
    List<SaveRebalancing> findByUserIdOrderByRecordDateDesc(@Param("user_id") String user_id);

    // 날짜 범위 조회
    @Query("SELECT s FROM SaveRebalancing s WHERE s.user_id = :user_id AND s.account = :account AND s.record_id BETWEEN :startDate AND :endDate ORDER BY s.record_date DESC")
    List<SaveRebalancing> findByUserIdAndAccountAndRecordDateBetween(
            @Param("user_id") String user_id,
            @Param("account") String account,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
