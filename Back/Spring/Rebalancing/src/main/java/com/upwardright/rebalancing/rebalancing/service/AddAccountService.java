package com.upwardright.rebalancing.rebalancing.service;

import com.upwardright.rebalancing.member.domain.UserConnectedId;
import com.upwardright.rebalancing.member.repository.UserConnectedIdRepository;
import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AddAccountService {
    private final AccountRepository accountRepository;
    private final UserConnectedIdRepository userConnectedIdRepository;

    @Transactional
    public Accounts addAccount(AddAccountRequest request) {
        // 계좌 중복 체크
        if (accountRepository.existsByAccountAndUser_id(request.getAccount(), request.getUser_id())) {
            throw new IllegalArgumentException("이미 등록된 계좌입니다");
        }

        try {
            // 1. user_connected_id 테이블에 connected_id가 있는지 확인
            if (!userConnectedIdRepository.existsByConnected_id(request.getConnected_id())) {
                // 없으면 새로 저장
                UserConnectedId connectedId = UserConnectedId.builder()
                        .connected_id(request.getConnected_id())
                        .user_id(request.getUser_id())
                        .account(request.getAccount())
                        .build();
                userConnectedIdRepository.save(connectedId);
            }

            // 2. principal 값이 0보다 작은 경우 0으로 설정
            double principal = Math.max(0.0, request.getPrincipal());

            // 3. 계좌 생성
            Accounts account = Accounts.builder()
                    .company(request.getCompany())
                    .account(request.getAccount())
                    .user_id(request.getUser_id())
                    .connected_id(request.getConnected_id())
                    .principal(principal)
                    .pre_principal(principal) // pre_principal은 principal과 동일하게 설정
                    .build();

            return accountRepository.save(account);
        } catch (Exception e) {
            throw new RuntimeException("계좌 추가 중 오류가 발생했습니다", e);
        }
    }
}