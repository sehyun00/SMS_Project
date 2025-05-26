package com.upwardright.rebalancing.rebalancing.repository;

import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancingStock;
import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancingStockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RebalancingStockRepository extends JpaRepository<SaveRebalancingStock, SaveRebalancingStockId> {

    // 1.리밸런싱 세부 내용 조회
    @Query("SELECT s FROM SaveRebalancingStock s WHERE s.record_id = :record_id")
    List<SaveRebalancingStock> findByRecordId(int record_id);
}
