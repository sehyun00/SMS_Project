package com.upwardright.rebalancing.rebalancing.controller;

import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingRequest;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingResponse;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingStockRequest;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingStockResponse;
import com.upwardright.rebalancing.rebalancing.service.SaveRebalancingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
public class RebalancingRecordController {

    private final SaveRebalancingService saveRebalancingService;

    /**
     * 리벨런싱 기록 저장
     */
    @PostMapping("/upwardright/mystockaccount/record/save")
    public ResponseEntity<SaveRebalancingResponse> saveRebalancing(
            @RequestBody SaveRebalancingRequest request,
            Authentication authentication) {
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
    public ResponseEntity<SaveRebalancingStockResponse> saveStocks(
            @RequestBody SaveRebalancingStockRequest request,
            Authentication authentication) {

        SaveRebalancingStockResponse response = saveRebalancingService.saveRebalancingStock(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 계좌의 리벨런싱 기록 목록 조회
     */
    @GetMapping("/upwardright/mystockaccount/record/account")
    public ResponseEntity<List<SaveRebalancingResponse>> getAccountRebalancingRecords(
            @RequestParam String account,
            Authentication authentication) {
        try {
            String user_id = authentication.getName();
            List<SaveRebalancingResponse> records = saveRebalancingService.getRebalancingRecords(account, user_id);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
