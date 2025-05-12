package com.upwardright.rebalancing.rebalancing.controller;

import com.upwardright.rebalancing.member.domain.UserConnectedId;
import com.upwardright.rebalancing.member.repository.UserConnectedIdRepository;
import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.dto.GetAccountResponse;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountRequest;
import com.upwardright.rebalancing.rebalancing.dto.AddAccountResponse;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import com.upwardright.rebalancing.rebalancing.service.AddAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@RestController
public class AccoountController {

    private final AddAccountService addAccountService;
    private final AccountRepository accountRepository;
    private final UserConnectedIdRepository userConnectedIdRepository;

    @PostMapping("/upwardright/getAccountStock")
    public ResponseEntity<?> getConnectedId(Authentication authentication) {
        String user_id = authentication.getName();
        List<UserConnectedId> userConnections = userConnectedIdRepository.findByUserId(user_id);

        if (userConnections.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // connected_id만 추출하여 리스트로 반환
        List<String> connectedIds = userConnections.stream()
                .map(UserConnectedId::getConnected_id)
                .collect(Collectors.toList());

        return ResponseEntity.ok(connectedIds);
    }


    @GetMapping("/upwardright/showstockaccounts")
    public ResponseEntity<List<GetAccountResponse>> getAccounts(Authentication authentication) {
        String userId = authentication.getName();
        List<Accounts> userAccounts = accountRepository.findByUserId(userId);

        List<GetAccountResponse> response = userAccounts.stream()
            .map(GetAccountResponse::fromEntity)
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
}
