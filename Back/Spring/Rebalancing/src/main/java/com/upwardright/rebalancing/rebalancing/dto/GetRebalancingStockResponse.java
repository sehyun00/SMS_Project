package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.RebalancingStock;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 조회용 Response 클래스
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GetRebalancingStockResponse {
    private int record_id;
    private String stock_name;
    private double expert_per;
    private double market_order;
    private double rate;
    private double nos;
    private double won;
    private double dollar;
    private double rebalancing_dollar;
    private int stock_region;
    private String market_type_name;

    // 단일 Entity를 받는 생성자
    public GetRebalancingStockResponse(RebalancingStock stock) {
        this.record_id = stock.getRecord_id();
        this.stock_name = stock.getStock_name();
        this.expert_per = stock.getExpert_per();
        this.market_order = stock.getMarket_order();
        this.rate = stock.getRate();
        this.nos = stock.getNos();
        this.won = stock.getWon();
        this.dollar = stock.getDollar();
        this.rebalancing_dollar = stock.getRebalancing_dollar();
        this.stock_region = stock.getStock_region();
        this.market_type_name = getMarketTypeName(stock.getStock_region());
    }

    private String getMarketTypeName(int stockRegion) {
        switch (stockRegion) {
            case 0: return "현금";
            case 1: return "국장";
            case 2: return "미장";
            default: return "기타";
        }
    }
}
