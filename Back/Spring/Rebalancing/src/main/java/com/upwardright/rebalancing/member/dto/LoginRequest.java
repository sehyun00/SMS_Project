// 로그인 요청 DTO
package com.upwardright.rebalancing.member.dto;

import lombok.Getter;
import lombok.Setter;

/*
    클래스 설명 : 해당 클래스는 LoginRequest를 어떤 값을 받을지 설정
 */
@Getter
@Setter
public class LoginRequest {
    private String user_id;
    private String password;
}

