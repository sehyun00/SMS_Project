package com.upwardright.rebalancing.rebalancing.dto;

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
    private String connected_id;
    private double principal;
    private String user_id;
}
