package com.upwardright.rebalancing.rebalancing.repository;

import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancingStock;
import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancingStockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SaveRebalancingStockRepository extends JpaRepository<SaveRebalancingStock, SaveRebalancingStockId> {
}
