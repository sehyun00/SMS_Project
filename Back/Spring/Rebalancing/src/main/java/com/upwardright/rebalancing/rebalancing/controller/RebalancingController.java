package com.upwardright.rebalancing.rebalancing.controller;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountResponse;
import com.upwardright.rebalancing.rebalancing.service.AddAccountService;
import com.upwardright.rebalancing.rebalancing.service.CodefApiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@RestController
public class RebalancingController {
    private final AddAccountService addAccountService;
    private final CodefApiService codefApiService;

    public RebalancingController(AddAccountService addAccountService, CodefApiService codefApiService) {
        this.addAccountService = addAccountService;
        this.codefApiService = codefApiService;
    }

    @GetMapping("/upwardright/mystockaccount")
    public ResponseEntity<?> myStockAccount(Authentication authentication) {
        // 인증된 사용자의 ID 가져오기 (Bearer Token으로부터)
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
            // 인증된 사용자 ID 설정 (Bearer Token으로부터)
            String userId = authentication.getName();
            request.setUserId(userId);

            // CODEF API를 통한 계좌 유효성 검증 (Basic Auth는 CodefApiService 내부에서 처리)
            Map<String, Object> accountValidation = codefApiService.getStockAccountInfo(
                    request.getCompany(),
                    request.getAccount(),
                    request.getPassword()
            );

            // CODEF API 응답 처리 (예시: 응답에 오류가 있는지 확인)
            if (accountValidation.containsKey("error") || accountValidation.containsKey("errorMessage")) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(new AddAccountResponse(
                                "계좌 정보가 유효하지 않습니다. 정확한 정보를 입력해주세요.",
                                request.getAccount(),
                                request.getCompany(),
                                false
                        ));
            }

            // 유효성 검증 통과 후 계좌 추가
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
