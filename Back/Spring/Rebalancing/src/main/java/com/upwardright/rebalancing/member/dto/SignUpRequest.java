// SignUpRequest.java
package com.upwardright.rebalancing.member.dto;

import com.upwardright.rebalancing.member.domain.User;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/*
    클래스 설명 : 해당 클래스는 SignUpRequest에 어떤 값을 받을지 설정
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequest {

    @NotBlank(message = "이메일은 필수 입력값입니다.")
    private String user_id;

    @NotBlank(message = "비밀번호는 필수 입력값입니다.")
    private String password;

    @NotBlank(message = "이름은 필수 입력값입니다.")
    private String name;

    @NotBlank(message = "전화번호는 필수 입력값입니다.")
    private String phoneNumber;

    public User toEntity() {
        return User.builder()
                .user_id(user_id)
                .password(password) // 실제 구현시 암호화 필요
                .name(name)
                .phone_number(phoneNumber)
                .build();
    }
}
