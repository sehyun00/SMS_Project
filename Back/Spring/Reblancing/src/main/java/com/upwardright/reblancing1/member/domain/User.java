package com.upwardright.reblancing1.member.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class User {
    
    @Id
    private String userId; //유저아이디 = 이메일
    private String password; //비밀번호
    private String name; //이름
    private String phonenumber; //전화번호

    @Enumerated(EnumType.STRING)
    private MemberShipType membership; //멤버쉽
}

enum MemberShipType {
    COMMON_USER,
    MEMBERSHIP_USER
}
