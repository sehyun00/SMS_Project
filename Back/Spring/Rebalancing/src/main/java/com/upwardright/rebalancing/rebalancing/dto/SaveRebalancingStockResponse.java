package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancingStock;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaveRebalancingStockResponse {
    private List<StockSaveResult> savedStocks;
    private int totalCount;
    private String message;

    public SaveRebalancingStockResponse(List<SaveRebalancingStock> stocks) {
        this.savedStocks = stocks.stream()
                .map(stock -> new StockSaveResult(
                        stock.getRecord_id(),
                        stock.getStock_name(),
                        stock.getStock_region()
                ))
                .collect(Collectors.toList());
        this.totalCount = stocks.size();
        this.message = "성공적으로 " + totalCount + "개의 주식 정보가 저장되었습니다.";
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockSaveResult {
        private int record_id;
        private String stock_name;
        private int stock_region;
    }


}
