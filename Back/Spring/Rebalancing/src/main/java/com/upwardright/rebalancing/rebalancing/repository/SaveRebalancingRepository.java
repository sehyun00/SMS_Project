package com.upwardright.rebalancing.rebalancing.repository;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SaveRebalancingRepository extends JpaRepository<SaveRebalancing, Integer> {

    // 특정 계좌의 리벨런싱 기록을 날짜 내림차순으로 조회
    List<SaveRebalancing> findByAccountOrderByRecord_dateDesc(Accounts account);

    // 특정 계좌의 리벨런싱 기록을 날짜 오름차순으로 조회
    List<SaveRebalancing> findByAccountOrderByRecord_dateAsc(Accounts account);

    // 특정 계좌의 특정 날짜 범위 리벨런싱 기록 조회
    List<SaveRebalancing> findByAccountAndRecord_dateBetween(
            Accounts account,
            LocalDateTime startDate,
            LocalDateTime endDate
    );
}
