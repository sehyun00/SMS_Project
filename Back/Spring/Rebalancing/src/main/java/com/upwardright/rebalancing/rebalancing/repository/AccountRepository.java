package com.upwardright.rebalancing.rebalancing.repository;

import com.upwardright.rebalancing.rebalancing.domain.AccountId;
import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccountRepository extends JpaRepository<Accounts, AccountId> {

    // 계좌 표현
    @Query("SELECT a FROM Accounts a WHERE a.user_id = :user_id")
    List<Accounts> findByUserId(@Param("user_id") String user_id);

    // 계좌번호와 사용자 ID로 계좌 존재 여부 확인
    @Query("SELECT COUNT(a) > 0 FROM Accounts a WHERE a.account = :account AND a.user_id = :user_id")
    boolean existsByAccountAndUser_id(@Param("account") String account, @Param("user_id") String user_id);
}
