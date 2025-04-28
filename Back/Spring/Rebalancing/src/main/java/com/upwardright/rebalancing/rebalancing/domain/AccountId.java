package com.upwardright.rebalancing.rebalancing.domain;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class AccountId implements Serializable {
    private String user_id; // 유저아이디
    private String account; // 계좌번호
}
