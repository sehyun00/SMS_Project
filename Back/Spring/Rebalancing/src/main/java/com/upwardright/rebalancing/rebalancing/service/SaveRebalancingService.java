package com.upwardright.rebalancing.rebalancing.service;

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

    // stock_region 결정 헬퍼 메서드
    private int determineStockRegion(String marketType) {
        if (marketType == null) return 0;

        return switch (marketType.trim()) {
            case "현금" -> 0;
            case "국장" -> 1;
            case "미장" -> 2;
            default -> 0; // 기본값은 현금
        };
    }


    // 3. 특정 계좌의 리밸런싱 기록 날짜 전송
    @Transactional(readOnly = true)
    public List<SaveRebalancingResponse> getRebalancingRecords(String account, String user_id) {
        try {
            
            // 1. 직접 user_id와 account로 조회
            List<SaveRebalancing> records = rebalancingRepository
                    .findByUserIdAndAccountOrderByRecordDateDesc(user_id.trim(), account.trim());

            // 2. 리밸런성 기록 결과 출력
            return records.stream()
                    .map(SaveRebalancingResponse::new)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.out.println("에러 발생: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // 4. record_id로 세부 기록 확인
    // 4. record_id로 세부 기록 확인
    @Transactional(readOnly = true)
    public List<GetRebalancingStockResponse> getRebalancingStockResponses(int record_id) {
        try {
            System.out.println("=== getRebalancingStockResponses 시작 ===");
            System.out.println("입력받은 record_id: " + record_id);

            // 2. Repository 호출 전 로깅
            System.out.println("Repository findByRecordId 호출 시작...");
            List<SaveRebalancingStock> records = rebalancingStockRepository.findByRecordId(record_id);
            System.out.println("Repository 호출 완료. 조회된 데이터 개수: " + records.size());

            // 3. 조회된 데이터 상세 로깅
            if (records.isEmpty()) {
                System.out.println("해당 record_id로 조회된 데이터가 없습니다: " + record_id);
                return new ArrayList<>();
            }

            // 4. 각 레코드 정보 출력
            for (int i = 0; i < records.size(); i++) {
                SaveRebalancingStock stock = records.get(i);
                System.out.println("레코드 " + (i+1) + ": " +
                        "record_id=" + stock.getRecord_id() +
                        ", stock_name=" + stock.getStock_name() +
                        ", stock_region=" + stock.getStock_region());
            }

            // 5. DTO 변환 시작
            System.out.println("DTO 변환 시작...");
            List<GetRebalancingStockResponse> responses = new ArrayList<>();

            for (SaveRebalancingStock record : records) {
                try {
                    GetRebalancingStockResponse response = new GetRebalancingStockResponse(record);
                    responses.add(response);
                    System.out.println("DTO 변환 성공: " + record.getStock_name());
                } catch (Exception e) {
                    System.out.println("DTO 변환 실패 - 주식명: " + record.getStock_name() +
                            ", 에러: " + e.getMessage());
                    e.printStackTrace();
                    throw e;
                }
            }

            System.out.println("DTO 변환 완료. 변환된 개수: " + responses.size());
            System.out.println("=== getRebalancingStockResponses 성공 ===");

            return responses;

        } catch (Exception e) {
            System.out.println("=== getRebalancingStockResponses 에러 발생 ===");
            System.out.println("에러 타입: " + e.getClass().getSimpleName());
            System.out.println("에러 메시지: " + e.getMessage());
            System.out.println("스택 트레이스:");
            e.printStackTrace();
            System.out.println("=== 에러 정보 끝 ===");

            // 구체적인 예외별 처리
            if (e instanceof IllegalArgumentException) {
                throw new RuntimeException("잘못된 파라미터: " + e.getMessage(), e);
            } else if (e instanceof NullPointerException) {
                throw new RuntimeException("Null 값 참조 오류: " + e.getMessage(), e);
            } else if (e.getMessage() != null && e.getMessage().contains("findByRecordId")) {
                throw new RuntimeException("데이터베이스 조회 오류: " + e.getMessage(), e);
            } else {
                throw new RuntimeException("리벨런싱 세부 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
        }
    }

}
