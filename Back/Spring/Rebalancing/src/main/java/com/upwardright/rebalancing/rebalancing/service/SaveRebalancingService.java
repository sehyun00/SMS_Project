package com.upwardright.rebalancing.rebalancing.service;

import com.upwardright.rebalancing.exception.AccountNotFoundException;
import com.upwardright.rebalancing.exception.RecordNotFoundException;
import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancing;
import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancingStock;
import com.upwardright.rebalancing.rebalancing.dto.*;
import com.upwardright.rebalancing.rebalancing.repository.RebalancingRepository;
import com.upwardright.rebalancing.rebalancing.repository.RebalancingStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaveRebalancingService {

    private final RebalancingRepository rebalancingRepository;
    private final RebalancingStockRepository rebalancingStockRepository;

    // 1.특정 계좌 리밸런싱 기록 날짜 저장
    @Transactional
    public SaveRebalancingResponse saveRebalancing(SaveRebalancingRequest request) {
        try {

            // 1. 리벨런싱 기록 생성
            SaveRebalancing saveRebalancing = SaveRebalancing.builder()
                    .user_id(request.getUser_id())
                    .account(request.getAccount())
                    .record_date(LocalDateTime.now())
                    .total_balance(request.getTotalBalance())
                    .record_name(request.getRecordName())
                    .memo(request.getMemo())
                    .profit_rate(request.getProfitRate())
                    .build();

            // 2. 리밸런싱 기록 저장
            SaveRebalancing savedRecord = rebalancingRepository.save(saveRebalancing);

            // 3. 결과값 반환
            return new SaveRebalancingResponse(savedRecord);
        } catch (Exception e) {
            throw new RuntimeException("리벨런싱 기록 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // 2. 해당 날짜 리밸런싱 세부 내용 저장(record_id로 조회)
    @Transactional
    public SaveRebalancingStockResponse saveRebalancingStock(SaveRebalancingStockRequest request) {
        try {
            List<SaveRebalancingStock> savedStocks = new ArrayList<>();

            // 각 주식 정보를 순회하며 저장
            for (SaveRebalancingStockRequest.StockInfo stockInfo : request.getStocks()) {

                // stock_region 결정 로직
                int stockRegion = determineStockRegion(stockInfo.getMarket_type());

                // 리벨런싱 세부 기록 생성
                SaveRebalancingStock saveRebalancingStock = SaveRebalancingStock.builder()
                        .record_id(request.getRecord_id())
                        .stock_name(stockInfo.getStock_name())
                        .expert_per(stockInfo.getExpert_per())
                        .market_order(stockInfo.getMarket_order())
                        .rate(stockInfo.getRate())
                        .nos(stockInfo.getNos())
                        .won(stockInfo.getWon())
                        .dollar(stockInfo.getDollar())
                        .rebalancing_dollar(stockInfo.getRebalancing_dollar())
                        .stock_region(stockRegion) // 지역 코드 설정
                        .build();

                // 각 주식 정보 저장
                SaveRebalancingStock savedStock = rebalancingStockRepository.save(saveRebalancingStock);
                savedStocks.add(savedStock);
            }

            // 결과값 반환
            return new SaveRebalancingStockResponse(savedStocks);

        } catch (Exception e) {
            throw new RuntimeException("세부 기록 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // stock_region 로직
    private int determineStockRegion(String marketType) {
        if (marketType == null) return 0;

        return switch (marketType.trim()) {
            case "현금" -> 0;
            case "국장" -> 1;
            case "미장" -> 2;
            default -> 0; // 기본값은 현금
        };
    }


    // 3. 특정 계좌의 기록 확인
    @Transactional(readOnly = true)
    public List<SaveRebalancingResponse> getRebalancingRecords(String account, String user_id) {
        List<SaveRebalancing> records = rebalancingRepository.findByUserIdAndAccountOrderByRecordDateDesc(account, user_id);

        if (records.isEmpty()) {
            throw new AccountNotFoundException("계좌를 찾을 수 없습니다: " + account);
        }

        return records.stream()
                .map(SaveRebalancingResponse::new)
                .collect(Collectors.toList());
    }

    // 4. record_id로 세부 기록 확인
    @Transactional(readOnly = true)
    public List<GetRebalancingStockResponse> getRebalancingStockResponses(int record_id) {
        List<SaveRebalancingStock> records = rebalancingStockRepository.findByRecordId(record_id);

        if (records.isEmpty()) {
            throw new RecordNotFoundException("record_id를 찾을 수 없습니다: " + record_id);
        }

        return records.stream()
                .map(GetRebalancingStockResponse::new)
                .collect(Collectors.toList());
    }

}
