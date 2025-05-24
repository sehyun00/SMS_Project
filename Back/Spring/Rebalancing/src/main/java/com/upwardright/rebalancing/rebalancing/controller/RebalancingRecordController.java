package com.upwardright.rebalancing.rebalancing.controller;

import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingRequest;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingResponse;
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
     * 기록 전체 보기 - 사용자의 모든 리벨런싱 기록 조회
     */
//    @GetMapping("/upwardright/mystockaccount/record")
//    public ResponseEntity<List<SaveRebalancingResponse>> rebalancingRecord(@RequestParam String userId) {
//        try {
//            List<SaveRebalancingResponse> records = saveRebalancingService.getUserRebalancingRecords(userId);
//            return ResponseEntity.ok(records);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().build();
//        }
//    }

    /**
     * 특정 기록 ID로 상세 조회
     */
    @GetMapping("/upwardright/mystockaccount/record/{recordId}")
    public ResponseEntity<SaveRebalancingResponse> rebalancingRecordDetail(@PathVariable int recordId) {
        try {
            SaveRebalancingResponse record = saveRebalancingService.getRebalancingRecord(recordId);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
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
