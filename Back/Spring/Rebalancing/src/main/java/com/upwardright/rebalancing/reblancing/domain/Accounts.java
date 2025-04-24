package com.upwardright.rebalancing.reblancing.domain;

import com.upwardright.rebalancing.member.domain.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/*
    클래스 설명 : 해당 클래스는 DB Table에 대한 설정
 */
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "accounts")
@IdClass(AccountId.class)  // 복합 키 클래스 지정
public class Accounts {

    @Id
    @Column(nullable = false)
    private String user_id; // 유저아이디 = 이메일

    @Id
    @Column(nullable = false)
    private String account; // 계좌번호

    @Column(nullable = false)
    private String company; //증권사

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", insertable = false, updatable = false)
    private User user; // User 엔티티와의 관계 설정
}
