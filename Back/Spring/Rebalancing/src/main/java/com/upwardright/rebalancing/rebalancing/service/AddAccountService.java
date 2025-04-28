package com.upwardright.rebalancing.rebalancing.service;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddAccountService {
    private final AccountRepository accountRepository;

    @Autowired
    private CodefApiService codefApiService; // CODEF API 호출 서비스

    @Transactional(readOnly = true)
    public List<Accounts> getUserAccounts(String userId) {
        return accountRepository.findByUserId(userId);
    }

    @Transactional
    public Accounts addAccount(AddAccountRequest request) {
        // 계좌 중복 체크
        if (accountRepository.existsByAccountAndUser_id(request.getAccount(), request.getUser_id())) {
            throw new IllegalArgumentException("이미 등록된 계좌입니다");
        }

        // CODEF API 호출하여 계좌 정보 검증 - 2개의 매개변수만 전달
        boolean isValid = codefApiService.validateAccount(
                request.getCompany(),
                request.getAccount()
        );

        if (!isValid) {
            throw new IllegalArgumentException("계좌 정보가 올바르지 않습니다");
        }

        // 계좌 저장
        Accounts account = request.toEntity();
        return accountRepository.save(account);
    }
}
