package com.upwardright.rebalancing.rebalancing.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "rud")
@IdClass(SaveRebalancingStockId.class)
public class SaveRebalancingStock {

    @Id
    @Column(nullable = false)
    private int record_id;

    @Id
    @Column(nullable = false)
    private String stock_name; // 주식명

    @Column(nullable = false)
    private double expert_per; // 사용자 ID

    @Column(nullable = false)
    private double market_order; // 시장가

    @Column(nullable = false)
    private double rate; //비율

    @Column(nullable = false)
    private double nos; //수량

    @Column
    private double won; //원화

    @Column
    private double dollar; //외화

    @Column
    private double rebalancing_dollar; //리벨런싱

    @Column(nullable = false)
    @Builder.Default
    private int stock_region = 0; //국장 미장    0 : 현금, 1 : 국장, 2 : 미장
}
