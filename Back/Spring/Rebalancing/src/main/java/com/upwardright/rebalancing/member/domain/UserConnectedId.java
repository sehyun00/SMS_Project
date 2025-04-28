package com.upwardright.rebalancing.member.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_connected_id")
@IdClass(UserConnectedIdPK.class)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserConnectedId {

    @Id
    @Column(nullable = false)
    private String user_id;

    @Id
    @Column(nullable = false)
    private String connected_id;
}
