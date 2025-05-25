package com.upwardright.rebalancing.rebalancing.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "record")
public class SaveRebalancing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private int record_id; //레코드 번호 자동으로 저장

    @Column(nullable = false)
    private String user_id; // 사용자 ID

    @Column(nullable = false)
    private String account; // 계좌번호

    @Column(nullable = false, name = "record_date")
    @CreatedDate
    private LocalDateTime record_date; //record date ex)2025:05:24:09:00:00

    @Column(nullable = false)
    private double total_balance; //리벨런싱 시점 총잔고

    @Column
    private String record_name;

    @Lob
    @Column
    private String memo;

    @Column
    private double profit_rate; //수익률
}
