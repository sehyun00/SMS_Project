package com.upwardright.rebalancing.rebalancing.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.Map;

@Getter
@AllArgsConstructor
public class AddAccountResponse {
    private String message;
    private String account;
    private String company;
    private boolean success;
    private Map<String, Object> accountDetails;  // CODEF API에서 반환된 계좌 세부 정보 (선택적)

    // 기존 생성자 유지 (accountDetails 없는 버전)
    public AddAccountResponse(String message, String account, String company, boolean success) {
        this.message = message;
        this.account = account;
        this.company = company;
        this.success = success;
        this.accountDetails = null;
    }
}
