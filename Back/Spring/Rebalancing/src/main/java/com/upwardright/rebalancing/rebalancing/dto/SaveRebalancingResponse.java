package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancing;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SaveRebalancingResponse {
    private int record_id;
    private String account;
    private String user_id;
    private LocalDateTime record_date;
    private double total_balance;
    private String record_name;
    private String memo;
    private double profit_rate;

    public SaveRebalancingResponse(SaveRebalancing saveRebalancing) {
        this.record_id = saveRebalancing.getRecord_id();
        this.account = saveRebalancing.getAccount();
        this.user_id = saveRebalancing.getUser_id();
        this.record_date = saveRebalancing.getRecord_date();
        this.total_balance = saveRebalancing.getTotal_balance();
        this.record_name = saveRebalancing.getRecord_name();
        this.memo = saveRebalancing.getMemo();
        this.profit_rate = saveRebalancing.getProfit_rate();
    }
}
