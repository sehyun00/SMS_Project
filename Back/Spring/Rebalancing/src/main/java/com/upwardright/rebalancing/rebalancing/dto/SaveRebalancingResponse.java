package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancing;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class SaveRebalancingResponse {

    private int record; // 레코드 번호
    private String accountNumber; // 계좌번호
    private LocalDateTime recordDate; // 기록 일자
    private double totalBalance; // 총잔고
    private String recordName; // 기록 이름
    private String memo; // 메모
    private double profitRate; // 수익률

    // Entity를 Response로 변환하는 생성자
    public SaveRebalancingResponse(SaveRebalancing saveRebalancing) {
        this.record = saveRebalancing.getRecord();
        this.accountNumber = saveRebalancing.getAccount().getAccount(); // Accounts 엔티티의 계좌번호 필드명에 따라 수정 필요
        this.recordDate = saveRebalancing.getRecord_date();
        this.totalBalance = saveRebalancing.getTotal_balance();
        this.recordName = saveRebalancing.getRecord_name();
        this.memo = saveRebalancing.getMemo();
        this.profitRate = saveRebalancing.getProfit_rate();
    }
}
