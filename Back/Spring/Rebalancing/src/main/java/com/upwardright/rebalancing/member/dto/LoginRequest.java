// 로그인 요청 DTO
package com.upwardright.rebalancing.member.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    private String user_id;
    private String password;
}

