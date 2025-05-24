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

    private String account; // 계좌번호
    private double totalBalance; // 리벨런싱 시점 총잔고
    private String user_id; // JWT에서 설정할 필드 (JSON 요청에는 포함하지 않음)
    private String recordName; // 기록 이름
    private String memo; // 메모
    private double profitRate; // 수익률
}
