package com.upwardright.rebalancing.member.domain;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserConnectedIdPK implements Serializable {
    private String user_id;
    private String connected_id;
}
