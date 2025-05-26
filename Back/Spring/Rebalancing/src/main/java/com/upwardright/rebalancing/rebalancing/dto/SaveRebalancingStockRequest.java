package com.upwardright.rebalancing.rebalancing.dto;

import jakarta.persistence.Column;
import lombok.*;

import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SaveRebalancingStockRequest {
    private int record_id;
    private List<StockInfo> stocks; // 여러 주식 정보를 담는 리스트

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockInfo {
        private String stock_name;
        private double expert_per;
        private double market_order;
        private double rate;
        private double nos;
        private double won;
        private double dollar;
        private double rebalancing_dollar;
        private String market_type; // "현금", "국장", "미장"
    }
}
