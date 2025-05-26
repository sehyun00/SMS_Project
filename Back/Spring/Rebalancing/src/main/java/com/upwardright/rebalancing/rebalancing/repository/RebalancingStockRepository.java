package com.upwardright.rebalancing.rebalancing.repository;

import com.upwardright.rebalancing.rebalancing.domain.RebalancingStock;
import com.upwardright.rebalancing.rebalancing.domain.RebalancingStockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RebalancingStockRepository extends JpaRepository<RebalancingStock, RebalancingStockId> {

    // 1.리밸런싱 세부 내용 조회
    @Query("SELECT s FROM RebalancingStock s WHERE s.record_id = :record_id")
    List<RebalancingStock> findByRecordId(int record_id);
}
