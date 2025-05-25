package com.upwardright.rebalancing.rebalancing.service;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancing;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingRequest;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingResponse;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import com.upwardright.rebalancing.rebalancing.repository.SaveRebalancingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaveRebalancingService {

    private final SaveRebalancingRepository saveRebalancingRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public SaveRebalancingResponse saveRebalancing(SaveRebalancingRequest request) {
        try {
            // 1. 계좌 존재 여부 확인
            List<Accounts> userAccounts = accountRepository.findByUserId(request.getUser_id());

            if (userAccounts.isEmpty()) {
                throw new RuntimeException("사용자의 계좌가 존재하지 않습니다: " + request.getUser_id());
            }

            boolean accountExists = userAccounts.stream()
                    .anyMatch(acc -> acc.getAccount().equals(request.getAccount()));

            if (!accountExists) {
                String accountList = userAccounts.stream()
                        .map(Accounts::getAccount)
                        .collect(Collectors.joining(", "));
                throw new RuntimeException("선택한 계좌가 존재하지 않습니다. 보유 계좌: " + accountList);
            }

            // 2. 리벨런싱 기록 생성 (user_id와 account 모두 저장)
            SaveRebalancing saveRebalancing = SaveRebalancing.builder()
                    .user_id(request.getUser_id())
                    .account(request.getAccount())
                    .record_date(LocalDateTime.now())
                    .total_balance(request.getTotalBalance())
                    .record_name(request.getRecordName())
                    .memo(request.getMemo())
                    .profit_rate(request.getProfitRate())
                    .build();

            SaveRebalancing savedRecord = saveRebalancingRepository.save(saveRebalancing);

            return new SaveRebalancingResponse(savedRecord);

        } catch (Exception e) {
            throw new RuntimeException("리벨런싱 기록 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    //특정 기록 날짜 세부 내용 보기
    @Transactional(readOnly = true)
    public List<SaveRebalancingResponse> getRebalancingRecords(String account, String user_id) {
        try {
            System.out.println("조회 파라미터 - account: " + account + ", user_id: " + user_id);
            System.out.println("account 타입: " + account.getClass().getName());
            System.out.println("user_id 타입: " + user_id.getClass().getName());
            
            // 전체 레코드 확인
            List<SaveRebalancing> allRecords = saveRebalancingRepository.findAll();
            System.out.println("\n=== 전체 레코드 정보 ===");
            allRecords.forEach(record -> {
                System.out.println("Record ID: " + record.getRecord_id());
                System.out.println("Account: " + record.getAccount() + " (길이: " + record.getAccount().length() + ")");
                System.out.println("User ID: " + record.getUser_id() + " (길이: " + record.getUser_id().length() + ")");
                System.out.println("Record Date: " + record.getRecord_date());
                System.out.println("-------------------");
            });
            
            // 파라미터 값 확인
            System.out.println("\n=== 파라미터 값 확인 ===");
            System.out.println("입력된 account 길이: " + account.length());
            System.out.println("입력된 user_id 길이: " + user_id.length());
            
            // 직접 user_id와 account로 조회
            List<SaveRebalancing> records = saveRebalancingRepository
                    .findByUserIdAndAccountOrderByRecordDateDesc(user_id.trim(), account.trim());
            
            System.out.println("\n조회된 레코드 수: " + records.size());

            return records.stream()
                    .map(SaveRebalancingResponse::new)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.out.println("에러 발생: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
