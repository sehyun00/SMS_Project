package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AccountResponse {
    private String account;
    private String company;
    private double principal;

    // Entity -> DTO 변환 정적 메서드
    public static AccountResponse fromEntity(Accounts account) {
        return new AccountResponse(
                account.getAccount(),
                account.getCompany(),
                account.getPrincipal()
        );
    }
}
