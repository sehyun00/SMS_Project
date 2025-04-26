package com.upwardright.rebalancing.rebalancing.controller;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountResponse;
import com.upwardright.rebalancing.rebalancing.service.AddAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
public class RebalancingController {
    private final AddAccountService addAccountService;

    public RebalancingController(AddAccountService addAccountService) {
        this.addAccountService = addAccountService;
    }

    @GetMapping("/upwardright/mystockaccount")
    public ResponseEntity<?> myStockAccount(Authentication authentication) {
        // 인증된 사용자의 ID 가져오기
        String userId = authentication.getName();
        List<Accounts> accounts = addAccountService.getUserAccounts(userId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/upwardright/mystockaccount/rebalancing")
    public String rebalancing(Authentication authentication) {
        return "rebalancing";
    }

    @PostMapping("/upwardright/addstockaccount")
    public ResponseEntity<AddAccountResponse> addAccount(@Valid @RequestBody AddAccountRequest request, Authentication authentication) {
        try {
            // 인증된 사용자 ID 설정
            String userId = authentication.getName();
            request.setUserId(userId);

            // 계좌 추가
            Accounts savedAccount = addAccountService.addAccount(request);

            return ResponseEntity.ok(
                    new AddAccountResponse(
                            "계좌가 성공적으로 등록되었습니다",
                            savedAccount.getAccount(),
                            savedAccount.getCompany(),
                            true
                    )
            );
        } catch (IllegalArgumentException e) {
            // 중복 계좌 또는 유효하지 않은 계좌 정보
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new AddAccountResponse(
                            e.getMessage(),
                            request.getAccount(),
                            request.getCompany(),
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
                            false
                    ));
        }
    }

    @PostMapping("/upwardright/mystockaccount/rebalancing")
    public String rebalancingProcess(@RequestBody String entity) {
        // AI 모델을 통해 리밸런싱 처리 진행
        return entity;
    }
}
