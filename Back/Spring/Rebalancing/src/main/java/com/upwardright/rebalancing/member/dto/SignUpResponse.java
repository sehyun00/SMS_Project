// SignUpResponse.java
package com.upwardright.rebalancing.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/*
    클래스 설명 : 해당 클래스는 SignUpRequest 대한 SignUpResponse 값
 */
@Getter
@AllArgsConstructor
public class SignUpResponse {
    private String message;
    private String userId;
}
