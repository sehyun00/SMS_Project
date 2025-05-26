package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.Rebalancing;
import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GetRebalancingResponse {
    private int record_id;
    private String account;
    private String user_id;
    private LocalDateTime record_date;
    private double total_balance;
    private String record_name;
    private String memo;
    private double profit_rate;

    public GetRebalancingResponse(Rebalancing rebalancing) {
        this.record_id = rebalancing.getRecord_id();
        this.account = rebalancing.getAccount();
        this.user_id = rebalancing.getUser_id();
        this.record_date = rebalancing.getRecord_date();
        this.total_balance = rebalancing.getTotal_balance();
        this.record_name = rebalancing.getRecord_name();
        this.memo = rebalancing.getMemo();
        this.profit_rate = rebalancing.getProfit_rate();
    }
}
