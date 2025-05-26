package com.upwardright.rebalancing.rebalancing.controller;

import com.upwardright.rebalancing.exception.AccountNotFoundException;
import com.upwardright.rebalancing.exception.RecordNotFoundException;
import com.upwardright.rebalancing.rebalancing.dto.*;
import com.upwardright.rebalancing.rebalancing.service.SaveRebalancingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@RestController
public class RebalancingRecordController {

    private final SaveRebalancingService saveRebalancingService;

    /**
     * 리벨런싱 기록 저장
     */
    @PostMapping("/upwardright/mystockaccount/record/save")
    public ResponseEntity<SaveRebalancingResponse> saveRebalancing(@RequestBody SaveRebalancingRequest request, Authentication authentication) {
        try {
            String user_id = authentication.getName();
            request.setUser_id(user_id); // JWT에서 추출한 user_id를 request에 세팅

            SaveRebalancingResponse response = saveRebalancingService.saveRebalancing(request); // 파라미터 1개만 전달
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 리벨런싱 세부내용 저장
     */
    @PostMapping("/upwardright/mystockaccount/record/detail/save")
    public ResponseEntity<SaveRebalancingStockResponse> saveStocks(@RequestBody SaveRebalancingStockRequest request) {
        try {
            SaveRebalancingStockResponse response = saveRebalancingService.saveRebalancingStock(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 특정 계좌의 리벨런싱 기록 목록 조회
     */
    @GetMapping("/upwardright/mystockaccount/record/account/{account}")
    public ResponseEntity<List<GetRebalancingResponse>> getAccountRebalancingRecords(@PathVariable String account, Authentication authentication) {
        String user_id = authentication.getName();
        List<GetRebalancingResponse> responses = saveRebalancingService.getRebalancingRecords(user_id, account);

        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 기록 세부 내용 조회
     */
    @GetMapping("/upwardright/mystockaccount/record/account/detail/{record_id}")
    public ResponseEntity<List<GetRebalancingStockResponse>> getRebalancingStockRecord(@PathVariable int record_id, Authentication authentication) {
        List<GetRebalancingStockResponse> responses = saveRebalancingService.getRebalancingStockResponses(record_id);

        return ResponseEntity.ok(responses);
    }

    //에러 처리 로직
    @ExceptionHandler(RecordNotFoundException.class)
    public ResponseEntity<Object> handleRecordNotFound(RecordNotFoundException e) {
        System.out.println("Record 조회 실패: " + e.getMessage());
        return ResponseEntity.status(404)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(AccountNotFoundException.class)
    public ResponseEntity<Object> handleAccountNotFound(AccountNotFoundException e) {
        System.out.println("계좌 조회 실패: " + e.getMessage());
        return ResponseEntity.status(404)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneralException(Exception e) {
        System.out.println("일반 오류 발생: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.badRequest()
                .body(Map.of("message", "요청 처리 중 오류가 발생했습니다"));
    }
}
