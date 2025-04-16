// 로그인 응답 DTO
package com.upwardright.rebalancing.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String user_id;
    private String name;
    private boolean success;
    private String message;
}
