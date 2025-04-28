package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddAccountRequest {
    @NotBlank(message = "증권사 코드는 필수입니다")
    private String company;

    @NotBlank(message = "계좌번호는 필수입니다")
    private String account;

    @NotBlank(message = "계좌 비밀번호는 필수입니다")
    private String password; // 비밀번호 필드 추가

    private String userId;

    public Accounts toEntity() {
        return Accounts.builder()
                .company(company)
                .account(account)
                .user_id(userId)
                .account_password(password)
                .principal(0.0)
                .pre_principal(0.0)
                .build();
    }
}
