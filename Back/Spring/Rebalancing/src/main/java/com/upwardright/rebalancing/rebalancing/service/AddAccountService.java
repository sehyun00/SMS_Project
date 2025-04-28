package com.upwardright.rebalancing.rebalancing.service;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import com.upwardright.rebalancing.security.RSAUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AddAccountService {
    private final AccountRepository accountRepository;
    private final RSAUtil rsaUtil;

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

        try {
            // RSA로 비밀번호 암호화 (이제 별도의 public key 파라미터가 필요 없음)
            String encryptedPassword = rsaUtil.encrypt(request.getPassword());

            // 계좌 생성 및 암호화된 비밀번호 설정
            Accounts account = Accounts.builder()
                    .company(request.getCompany())
                    .account(request.getAccount())
                    .user_id(request.getUserId())
                    .account_password(encryptedPassword)
                    .connected_id("") // Flask에서 처리할 값
                    .principal(0.0)
                    .pre_principal(0.0)
                    .build();

            return accountRepository.save(account);
        } catch (Exception e) {
            throw new RuntimeException("비밀번호 암호화 중 오류가 발생했습니다", e);
        }
    }
}
