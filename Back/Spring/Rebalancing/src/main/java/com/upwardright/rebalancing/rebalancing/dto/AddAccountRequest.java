package com.upwardright.rebalancing.rebalancing.dto;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AddAccountRequest {
    @NotBlank(message = "계좌번호는 필수 입력값입니다.")
    private String account;

    @NotBlank(message = "증권사는 필수 입력값입니다.")
    private String company;

    // 로그인한 사용자 ID 설정 시 사용
    private String user_id;

    public void setUserId(String user_id) {
        this.user_id = user_id;
    }

    public Accounts toEntity() {
        return Accounts.builder()
                .user_id(user_id)
                .account(account)
                .company(company)
                .build();
    }
}
