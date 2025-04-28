package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AccountResponse {
    private String user_id;
    private String account;
    private String company;
    private String connected_id;
    private double principal;
    private double pre_principal;

    // Entity -> DTO 변환 정적 메서드
    public static AccountResponse fromEntity(Accounts account) {
        return new AccountResponse(
                account.getUser_id(),
                account.getAccount(),
                account.getCompany(),
                account.getConnected_id(),
                account.getPrincipal(),
                account.getPre_principal()
        );
    }
}
