package com.upwardright.rebalancing.rebalancing.service;

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
    private final CodefApiService codefApiService;

    @Transactional(readOnly = true)
    public List<Accounts> getUserAccounts(String userId) {
        return accountRepository.findByUserId(userId);
    }

    @Transactional
    public Accounts addAccount(AddAccountRequest request) {
        // 계좌 중복 체크
        if (accountRepository.existsByAccountAndUser_id(request.getAccount(), request.getUserId())) {
            throw new IllegalArgumentException("이미 등록된 계좌입니다");
        }

        // CODEF API 호출하여 계좌 정보 검증 (비밀번호 포함)
        boolean isValid = codefApiService.validateAccount(
                request.getCompany(),
                request.getAccount(),
                request.getPassword() // 비밀번호 추가
        );

        if (!isValid) {
            throw new IllegalArgumentException("계좌 정보가 올바르지 않습니다");
        }

        // 계좌 저장 - 비밀번호는 저장하지 않음 (보안상의 이유)
        Accounts account = request.toEntity();
        return accountRepository.save(account);
    }
}
