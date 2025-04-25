// 로그인 응답 DTO
package com.upwardright.rebalancing.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/*
    클래스 설명 : 해당 클래스는 LoginRequest에 대한 LoginResponse 값
 */
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
