package com.upwardright.rebalancing.rebalancing.controller;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.AccountResponse;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountResponse;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import com.upwardright.rebalancing.rebalancing.service.AddAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class RebalancingController {
    private final AddAccountService addAccountService;
    private final AccountRepository accountRepository;

    public RebalancingController(AddAccountService addAccountService, AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
        this.addAccountService = addAccountService;
    }

    @GetMapping("/upwardright/showstockaccounts")
    public ResponseEntity<List<AccountResponse>> getAccounts(Authentication authentication) {
        String userId = authentication.getName();
        List<Accounts> userAccounts = accountRepository.findByUserId(userId);

        List<AccountResponse> response = userAccounts.stream()
            .map(AccountResponse::fromEntity)
            .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }


    @PostMapping("/upwardright/addstockaccount")
    public ResponseEntity<AddAccountResponse> addAccount(@Valid Authentication authentication, @RequestBody AddAccountRequest request) {
        try {
            // 인증된 사용자 ID 설정
            String user_id = authentication.getName();
            request.setUser_id(user_id);

            Accounts savedAccount = addAccountService.addAccount(request);

            return ResponseEntity.ok(
                    new AddAccountResponse(
                            "계좌가 성공적으로 등록되었습니다",
                            savedAccount.getAccount(),
                            savedAccount.getCompany(),
                            savedAccount.getConnected_id(),
                            true
                    )
            );
        } catch (IllegalArgumentException e) {
            // 중복 계좌
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new AddAccountResponse(
                            e.getMessage(),
                            request.getAccount(),
                            request.getCompany(),
                            request.getConnected_id(),
                            false
                    ));
        } catch (Exception e) {
            // 기타 서버 에러
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AddAccountResponse(
                            "계좌 추가 중 오류가 발생했습니다: " + e.getMessage(),
                            request.getAccount(),
                            request.getCompany(),
                            request.getConnected_id(),
                            false
                    ));
        }
    }

//    @PostMapping("/upwardright/mystockaccount/rebalancing")
//    public String rebalancingProcess(@RequestBody String entity) {
//        // AI 모델을 통해 리밸런싱 처리 진행 - Flask API에서 처리될 예정
//        return entity;
//    }
}
