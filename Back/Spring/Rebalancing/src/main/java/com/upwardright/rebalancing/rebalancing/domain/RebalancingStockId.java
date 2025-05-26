package com.upwardright.rebalancing.rebalancing.domain;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RebalancingStockId implements Serializable {
    private int record_id; // 기록 번호
    private String stock_name; // 주식명
}
