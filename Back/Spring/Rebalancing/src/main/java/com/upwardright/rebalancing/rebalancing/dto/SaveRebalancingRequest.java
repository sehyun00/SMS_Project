package com.upwardright.rebalancing.rebalancing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SaveRebalancingRequest {

    private String accountNumber; // 계좌번호
    private String userId; // 사용자 ID (계좌 조회에 필요)
    private double totalBalance; // 리벨런싱 시점 총잔고
    private String recordName; // 기록 이름
    private String memo; // 메모
    private double profitRate; // 수익률
}
