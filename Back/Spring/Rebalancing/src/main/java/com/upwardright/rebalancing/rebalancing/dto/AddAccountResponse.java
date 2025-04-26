package com.upwardright.rebalancing.rebalancing.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AddAccountResponse {
    private String message;
    private String account;
    private String company;
    private boolean success;
}
