package com.upwardright.rebalancing.rebalancing.service;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

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
        if (accountRepository.existsByAccountAndUser_id(request.getAccount(), request.getUser_id())) {
            throw new IllegalArgumentException("이미 등록된 계좌입니다");
        }

        // CODEF API 호출하여 계좌 정보 검증
        Map<String, Object> accountValidation = codefApiService.getStockAccountInfo(
                request.getCompany(),
                request.getAccount(),
                request.getPassword()
        );

        // API 응답 검증
        if (accountValidation.containsKey("error") || !validateResponse(accountValidation)) {
            throw new IllegalArgumentException("계좌 정보가 올바르지 않습니다");
        }

        // 유효성 검증을 통과한 경우에만 계좌 저장
        // 비밀번호 등 민감 정보는 저장하지 않음 - toEntity()는 사용자 ID, 계좌번호, 증권사만 포함
        Accounts account = request.toEntity();
        return accountRepository.save(account);
    }

    // CODEF API 응답 검증 헬퍼 메서드
    private boolean validateResponse(Map<String, Object> response) {
        // 여기서 API 응답의 유효성을 검증
        // 예시: response에서 성공 여부를 확인하는 로직
        return response != null && response.containsKey("result") &&
                "success".equals(response.get("result"));
    }
}
