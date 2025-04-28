package com.upwardright.rebalancing.rebalancing.domain;

import com.upwardright.rebalancing.member.domain.User;
import jakarta.persistence.*;
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
@Table(name = "accounts")
@IdClass(AccountId.class)
public class Accounts {

    @Id
    @Column(nullable = false)
    private String user_id; // 유저아이디 = 이메일

    @Id
    @Column(nullable = false)
    private String account; // 계좌번호

    @Column(nullable = false)
    private String company; //증권사

    @Column(nullable = false)
    private String connected_id; // 연결 ID

    @Column(nullable = false)
    private double principal; // 원금

    @Column(nullable = false)
    private double pre_principal; // 이전 원금

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", insertable = false, updatable = false)
    private User user; // User 엔티티와의 관계 설정
}
