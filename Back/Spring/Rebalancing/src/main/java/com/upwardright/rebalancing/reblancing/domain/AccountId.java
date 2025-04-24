package com.upwardright.rebalancing.reblancing.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountId implements Serializable {
    private String user_id;
    private String account;
}
